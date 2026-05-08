import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LabAppointment, LabAppointmentDocument, AnalysisType, SubscriptionTier } from './schemas/lab-appointment.schema';
import { LabService } from '../lab/lab.service';
import { ProfilesService } from '../profiles/profiles.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.schema';
import { UserRole } from '../users/schemas/user.schema';
import { MlApiService } from '../ml/ml-api.service';

@Injectable()
export class LabAppointmentsService {
    constructor(
        @InjectModel(LabAppointment.name) private labAppointmentModel: Model<LabAppointmentDocument>,
        private labService: LabService,
        private profilesService: ProfilesService,
        private notificationService: NotificationService,
        private mlApiService: MlApiService,
    ) { }

    // ========== MAPPING CATÉGORIE → TYPE D'ANALYSE ==========
    private mapCategoryToAnalysisType(category: string): AnalysisType {
        const map: Record<string, AnalysisType> = {
            'sang': AnalysisType.ANALYSE_SANGUIN,
            'analyse sanguin': AnalysisType.ANALYSE_SANGUIN,
            'analyse_sanguin': AnalysisType.ANALYSE_SANGUIN,
            'scanner': AnalysisType.SCANNER,
            'radiologie': AnalysisType.RADIOLOGIE,
            'imagerie': AnalysisType.IMAGERIE,
            'biologie': AnalysisType.BIOLOGIE,
            'neuro': AnalysisType.BIOLOGIE,
        };
        return map[category.toLowerCase().trim()] || AnalysisType.AUTRE;
    }

    /** Aligné sur python/ml_app.py — si le Flask ML est arrêté, on accepte quand même les vraies urgences. */
    private noteIndiqueUrgence(note: string | undefined): boolean {
        const n = (note || '').toLowerCase();
        const markers = [
            'urgent',
            'urgence',
            'critique',
            'immédiat',
            'immediate',
            'asap',
            'prioritaire',
            'priorité',
            'priorite',
            'grave',
            'douleur intense',
        ];
        return markers.some((m) => n.includes(m));
    }

    // ========== CRÉER UN RENDEZ-VOUS (PATIENT) ==========
    async createAppointment(patientId: string, data: Partial<LabAppointment>): Promise<LabAppointmentDocument> {
        // Vérifier que la date n'est pas dans le passé (comparaison par jour, pas par heure)
        if (data.appointmentDate) {
            const apptDate = new Date(data.appointmentDate);
            const today = new Date();
            apptDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            if (apptDate < today) {
                throw new BadRequestException('La date du rendez-vous ne peut pas être dans le passé');
            }
        }

        // Résoudre le labId depuis la payload ou depuis le centreName
        let labId: Types.ObjectId | undefined;
        if (data.labId) {
            labId = new Types.ObjectId(data.labId as any);
        } else if (data.centreName) {
            const labs = await this.labService.getAllLabs();
            const lab = labs.find(l => l.centreName === data.centreName);
            if (lab) {
                labId = lab._id as Types.ObjectId;
            }
        }

        // Mapper analysisType
        let analysisType: AnalysisType = AnalysisType.AUTRE;
        if (data.analysisType) {
            const val = data.analysisType as string;
            analysisType = Object.values(AnalysisType).includes(val as AnalysisType)
                ? (val as AnalysisType)
                : this.mapCategoryToAnalysisType(val);
        }
        if (analysisType === AnalysisType.AUTRE && data.analysisTypeOther) {
            const mapped = this.mapCategoryToAnalysisType(data.analysisTypeOther);
            if (mapped !== AnalysisType.AUTRE) analysisType = mapped;
        }

        // ── Récupérer les infos patient pour le modèle ML ──
        let patientName = 'Un patient';
        let patientAllergies: string[] = [];
        try {
            const profile = await this.profilesService.getProfile(patientId, UserRole.PATIENT);
            if (profile?.fullName) patientName = profile.fullName;
            if (profile?.allergies?.length) patientAllergies = profile.allergies;
        } catch { /* silencieux */ }

        // ── Résoudre le subscriptionTier ──
        const subscriptionTier: SubscriptionTier =
            Object.values(SubscriptionTier).includes(data.subscriptionTier as SubscriptionTier)
                ? (data.subscriptionTier as SubscriptionTier)
                : SubscriptionTier.FREE;

        console.log(`[LabAppointments] Tier du patient: "${subscriptionTier}"`);

        // ── Statut selon le modèle ML (predict-ml-api) ──
        let status: 'accepted' | 'pending' = 'pending';

        try {
            const mlPayload = {
                note: data.notes || '',
                type_analyse: analysisType,
                allergies: patientAllergies.join('|'),
            };
            const mlResult = await this.mlApiService.predictLab(mlPayload);

            if (mlResult?.error) {
                console.warn('[LabAppointments] ML ml-api indisponible:', mlResult.details);
                if (this.noteIndiqueUrgence(data.notes)) {
                    status = 'accepted';
                    console.warn(
                        '[LabAppointments] Secours: note urgente acceptée alors que le service Python (port 5000) ne répond pas — lancez `npm run start:dev` ou `npm run ml:predict`.',
                    );
                }
            } else {
                const r = String(mlResult?.result ?? '').trim();
                if (r === 'Acceptée automatiquement') {
                    status = 'accepted';
                }
                console.log(`[LabAppointments] ML ml-api → "${r}" → statut: ${status}`);
            }
        } catch (err: any) {
            console.warn('[LabAppointments] ML indisponible, statut: pending', err?.message);
            if (this.noteIndiqueUrgence(data.notes)) {
                status = 'accepted';
                console.warn(
                    '[LabAppointments] Secours urgence (exception ML) — vérifiez que Flask tourne sur le port 5000.',
                );
            }
        }

        const appointment = new this.labAppointmentModel({
            ...data,
            patientId: new Types.ObjectId(patientId),
            labId,
            analysisType,
            subscriptionTier,
            status,
        });

        const saved = await appointment.save();

        // ── Notifications ──
        if (labId) {
            try {
                const labProfile = await this.labService.getLabById(labId.toString());
                if (labProfile?.userId) {
                    if (status === 'accepted') {
                        // Notifier le centre que la demande est auto-acceptée
                        await this.notificationService.createNotification({
                            userId: labProfile.userId.toString(),
                            type: NotificationType.APPOINTMENT,
                            title: 'Nouvelle demande acceptée automatiquement ✅',
                            message: `${patientName} a une demande acceptée automatiquement pour le ${new Date(saved.appointmentDate).toLocaleDateString('fr-FR')} — ${saved.centreName}`,
                            data: {
                                appointmentId: saved._id.toString(),
                                patientId,
                                status: 'accepted',
                                centreName: saved.centreName,
                                appointmentDate: saved.appointmentDate,
                                analysisType: saved.analysisType,
                            },
                        });
                    } else {
                        // Notifier le centre d'une nouvelle demande en attente
                        await this.notificationService.createNotification({
                            userId: labProfile.userId.toString(),
                            type: NotificationType.APPOINTMENT,
                            title: 'Nouvelle demande de rendez-vous',
                            message: `${patientName} a demandé un rendez-vous pour le ${new Date(saved.appointmentDate).toLocaleDateString('fr-FR')} — ${saved.centreName}`,
                            data: {
                                appointmentId: saved._id.toString(),
                                patientId,
                                status: 'pending',
                                centreName: saved.centreName,
                                appointmentDate: saved.appointmentDate,
                                analysisType: saved.analysisType,
                            },
                        });
                    }
                }
            } catch (err) {
                console.error('[LabAppointments] Erreur notification centre:', err);
            }
        }

        // Notifier le patient si accepté automatiquement
        if (status === 'accepted') {
            try {
                await this.notificationService.createNotification({
                    userId: patientId,
                    type: NotificationType.APPOINTMENT,
                    title: 'Demande acceptée automatiquement ✅',
                    message: `Votre demande de rendez-vous du ${new Date(saved.appointmentDate).toLocaleDateString('fr-FR')} au centre ${saved.centreName} a été acceptée automatiquement.`,
                    data: { appointmentId: saved._id.toString(), status: 'accepted', centreName: saved.centreName },
                });
            } catch (err) {
                console.error('[LabAppointments] Erreur notification patient auto-accept:', err);
            }
        }

        return saved;
    }

    // ========== MES RENDEZ-VOUS (PATIENT) ==========
    async getPatientAppointments(patientId: string): Promise<LabAppointmentDocument[]> {
        return this.labAppointmentModel
            .find({ patientId: new Types.ObjectId(patientId) })
            .select('-__v')
            .sort({ appointmentDate: 1 })
            .exec();
    }

    // ========== UN RENDEZ-VOUS PAR ID ==========
    async getAppointmentById(appointmentId: string, patientId?: string): Promise<LabAppointmentDocument> {
        if (!Types.ObjectId.isValid(appointmentId)) {
            throw new NotFoundException('ID de rendez-vous invalide');
        }
        const query: any = { _id: new Types.ObjectId(appointmentId) };
        if (patientId) query.patientId = new Types.ObjectId(patientId);

        const appt = await this.labAppointmentModel.findOne(query).select('-__v').exec();
        if (!appt) throw new NotFoundException('Rendez-vous non trouvé');
        return appt;
    }

    // ========== MODIFIER UN RENDEZ-VOUS (PATIENT) ==========
    async updateAppointment(appointmentId: string, patientId: string, data: Partial<LabAppointment>): Promise<LabAppointmentDocument> {
        const appt = await this.getAppointmentById(appointmentId, patientId);
        if (data.appointmentDate) {
            const apptDate = new Date(data.appointmentDate);
            const today = new Date();
            apptDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            if (apptDate < today) {
                throw new BadRequestException('La date du rendez-vous ne peut pas être dans le passé');
            }
        }
        if (data.analysisType && typeof data.analysisType === 'string') {
            const val = data.analysisType as string;
            if (!Object.values(AnalysisType).includes(val as AnalysisType)) {
                data.analysisType = this.mapCategoryToAnalysisType(val);
            }
        }
        Object.assign(appt, data);
        return appt.save();
    }

    // ========== ANNULER UN RENDEZ-VOUS (PATIENT) ==========
    async deleteAppointment(appointmentId: string, patientId: string): Promise<void> {
        const appt = await this.getAppointmentById(appointmentId, patientId);
        await this.labAppointmentModel.deleteOne({ _id: appt._id }).exec();
    }

    private async buildPatientInfo(patientUser: any, patientIdStr: string): Promise<Record<string, any>> {
        const base = {
            fullName: '',
            email: patientUser?.email || '',
            phone: patientUser?.phone || '',
            age: null,
            gender: null,
            allergies: [],
            chronicDiseases: [],
            height: null,
            weight: null,
        };

        try {
            const profile = await this.profilesService.getProfile(patientIdStr, UserRole.PATIENT);
            if (profile) {
                // Vérification du contrôle d'accès
                let hasAccess = true;
                if (profile.temporaryAccessEnabled !== undefined) {
                    if (!profile.temporaryAccessEnabled) {
                        hasAccess = false;
                    } else if (profile.temporaryAccessUntil && new Date(profile.temporaryAccessUntil) < new Date()) {
                        hasAccess = false; // Expired
                    }
                }

                if (!hasAccess) {
                    base.fullName = 'Accès Restreint';
                    base.email = 'anonyme@patient.com';
                    base.phone = '******';
                    base.allergies = [];
                    base.chronicDiseases = [];
                } else {
                    base.fullName         = profile.fullName         || '';
                    base.age              = profile.age              ?? null;
                    base.gender           = profile.gender           ?? null;
                    base.allergies        = profile.allergies        || [];
                    base.chronicDiseases  = profile.chronicDiseases  || [];
                    base.height           = profile.height           ?? null;
                    base.weight           = profile.weight           ?? null;
                }
            }
        } catch {
            /* silencieux — on renvoie les champs de base */
        }

        return base;
    }

    // ========== TOUS LES RDV DU CENTRE (LAB) ==========
    async getLabAppointments(labProfileId: string): Promise<any[]> {
        const appointments = await this.labAppointmentModel
            .find({ labId: new Types.ObjectId(labProfileId) })
            .populate('patientId', 'email phone')
            .select('-__v')
            .sort({ appointmentDate: 1 })
            .exec();

        return Promise.all(
            appointments.map(async (appt) => {
                const obj = appt.toObject() as any;
                const patientUser = obj.patientId as any;
                const patientIdStr = patientUser?._id?.toString() || patientUser?.toString();

                obj.patientInfo = await this.buildPatientInfo(patientUser, patientIdStr);
                
                // Injecter dans patientId pour compatibilité avec le frontend (masquage email)
                if (typeof obj.patientId === 'object' && obj.patientId !== null) {
                    if (obj.patientInfo?.fullName === 'Accès Restreint') {
                        // Le patient a bloqué l'accès : on ne renvoie pas l'objet patientId pour le cacher du frontend
                        obj.patientId = null;
                    } else {
                        obj.patientId = {
                            ...obj.patientId,
                            ...obj.patientInfo,
                        };
                    }
                }
                
                return obj;
            })
        );
    }

    // ========== DÉTAIL ENRICHI D'UN RDV (LAB) ==========
    async getAppointmentDetails(appointmentId: string, labProfileId: string): Promise<any> {
        if (!Types.ObjectId.isValid(appointmentId)) {
            throw new NotFoundException('ID de rendez-vous invalide');
        }

        const appt = await this.labAppointmentModel
            .findOne({
                _id: new Types.ObjectId(appointmentId),
                labId: new Types.ObjectId(labProfileId),
            })
            .populate('patientId', 'email phone')
            .select('-__v')
            .exec();

        if (!appt) throw new NotFoundException('Rendez-vous non trouvé ou ne vous appartient pas');

        const obj = appt.toObject() as any;
        const patientUser = obj.patientId as any;
        const patientIdStr = patientUser?._id?.toString() || patientUser?.toString();

        obj.patientInfo = await this.buildPatientInfo(patientUser, patientIdStr);

        // Injecter aussi dans patientId pour compatibilité frontend (appointment['patientId'].age, etc.)
        if (typeof obj.patientId === 'object' && obj.patientId !== null) {
            obj.patientId = {
                ...obj.patientId,
                ...obj.patientInfo,
            };
        }

        return obj;
    }

    // ========== ACCEPTER UN RENDEZ-VOUS (LAB) ==========
    async acceptAppointment(appointmentId: string, labProfileId: string): Promise<LabAppointmentDocument> {
        if (!Types.ObjectId.isValid(appointmentId)) throw new NotFoundException('ID invalide');

        const appt = await this.labAppointmentModel.findOne({
            _id: new Types.ObjectId(appointmentId),
            labId: new Types.ObjectId(labProfileId),
        }).exec();
        if (!appt) throw new NotFoundException('Rendez-vous non trouvé ou ne vous appartient pas');

        appt.status = 'accepted';
        const saved = await appt.save();

        try {
            await this.notificationService.createNotification({
                userId: saved.patientId.toString(),
                type: NotificationType.APPOINTMENT,
                title: 'Rendez-vous accepté ✅',
                message: `Votre rendez-vous du ${new Date(saved.appointmentDate).toLocaleDateString('fr-FR')} au centre ${saved.centreName} a été accepté.`,
                data: { appointmentId: saved._id.toString(), status: 'accepted', centreName: saved.centreName },
            });
        } catch (err) {
            console.error('[LabAppointments] Erreur notification patient:', err);
        }

        return saved;
    }

    // ========== REFUSER UN RENDEZ-VOUS (LAB) ==========
    async rejectAppointment(appointmentId: string, labProfileId: string): Promise<LabAppointmentDocument> {
        if (!Types.ObjectId.isValid(appointmentId)) throw new NotFoundException('ID invalide');

        const appt = await this.labAppointmentModel.findOne({
            _id: new Types.ObjectId(appointmentId),
            labId: new Types.ObjectId(labProfileId),
        }).exec();
        if (!appt) throw new NotFoundException('Rendez-vous non trouvé ou ne vous appartient pas');

        appt.status = 'rejected';
        const saved = await appt.save();

        try {
            await this.notificationService.createNotification({
                userId: saved.patientId.toString(),
                type: NotificationType.APPOINTMENT,
                title: 'Rendez-vous refusé ❌',
                message: `Votre rendez-vous du ${new Date(saved.appointmentDate).toLocaleDateString('fr-FR')} au centre ${saved.centreName} a été refusé.`,
                data: { appointmentId: saved._id.toString(), status: 'rejected', centreName: saved.centreName },
            });
        } catch (err) {
            console.error('[LabAppointments] Erreur notification patient:', err);
        }

        return saved;
    }

    // ========== REMETTRE EN ATTENTE (LAB) ==========
    async setPendingAppointment(appointmentId: string, labProfileId: string): Promise<LabAppointmentDocument> {
        if (!Types.ObjectId.isValid(appointmentId)) throw new NotFoundException('ID invalide');

        const appt = await this.labAppointmentModel.findOne({
            _id: new Types.ObjectId(appointmentId),
            labId: new Types.ObjectId(labProfileId),
        }).exec();
        if (!appt) throw new NotFoundException('Rendez-vous non trouvé ou ne vous appartient pas');

        appt.status = 'pending';
        return appt.save();
    }
}
