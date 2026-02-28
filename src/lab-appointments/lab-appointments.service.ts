import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LabAppointment, LabAppointmentDocument, AnalysisType } from './schemas/lab-appointment.schema';
import { LabService } from '../lab/lab.service';
import { ProfilesService } from '../profiles/profiles.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.schema';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class LabAppointmentsService {
    constructor(
        @InjectModel(LabAppointment.name) private labAppointmentModel: Model<LabAppointmentDocument>,
        private labService: LabService,
        private profilesService: ProfilesService,
        private notificationService: NotificationService,
    ) {}

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

    // ========== CRÉER UN RENDEZ-VOUS (PATIENT) ==========
    async createAppointment(patientId: string, data: Partial<LabAppointment>): Promise<LabAppointmentDocument> {
        // Vérifier que la date n'est pas dans le passé
        if (data.appointmentDate && new Date(data.appointmentDate) < new Date()) {
            throw new BadRequestException('La date du rendez-vous ne peut pas être dans le passé');
        }

        // Résoudre le labId depuis le centreName si fourni
        let labId: Types.ObjectId | undefined;
        if (data.centreName) {
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

        const appointment = new this.labAppointmentModel({
            ...data,
            patientId: new Types.ObjectId(patientId),
            labId,
            analysisType,
            status: 'pending',
        });

        const saved = await appointment.save();

        // Notification au centre d'analyse
        if (labId) {
            try {
                const labProfile = await this.labService.getLabById(labId.toString());
                if (labProfile?.userId) {
                    let patientName = 'Un patient';
                    try {
                        const profile = await this.profilesService.getProfile(patientId, UserRole.PATIENT);
                        if (profile?.fullName) patientName = profile.fullName;
                    } catch { /* silencieux */ }

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
            } catch (err) {
                console.error('[LabAppointments] Erreur notification centre:', err);
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
        if (data.appointmentDate && new Date(data.appointmentDate) < new Date()) {
            throw new BadRequestException('La date du rendez-vous ne peut pas être dans le passé');
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

                try {
                    const profile = await this.profilesService.getProfile(patientIdStr, UserRole.PATIENT);
                    obj.patientInfo = {
                        fullName: profile?.fullName || '',
                        email: patientUser?.email || '',
                        phone: patientUser?.phone || '',
                    };
                } catch {
                    obj.patientInfo = { fullName: '', email: patientUser?.email || '', phone: patientUser?.phone || '' };
                }
                return obj;
            })
        );
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
