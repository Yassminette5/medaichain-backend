import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Clinic, ClinicDocument } from './schemas/clinic.schema';
import { ClinicDoctor, ClinicDoctorDocument } from './schemas/clinic-doctor.schema';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { Admission, AdmissionDocument } from './schemas/admission.schema';
import { MedicalRecord, MedicalRecordDocument } from './schemas/medical-record.schema';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { ClinicConfig, ClinicConfigDocument } from './schemas/clinic-config.schema';
import { CreateClinicDto, UpdateClinicDto } from './dto/clinic.dto';
import { AddDoctorToClinicDto, UpdateClinicDoctorDto } from './dto/clinic-doctor.dto';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';
import { CreateAdmissionDto, UpdateAdmissionDto } from './dto/admission.dto';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from './dto/medical-record.dto';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ProfilesService } from '../profiles/profiles.service';
import { UserRole } from '../users/schemas/user.schema';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.schema';
import { AppointmentStatus } from './schemas/appointment.schema';

@Injectable()
export class ClinicManagementService {
    constructor(
        @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
        @InjectModel(ClinicDoctor.name) private clinicDoctorModel: Model<ClinicDoctorDocument>,
        @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
        @InjectModel(Admission.name) private admissionModel: Model<AdmissionDocument>,
        @InjectModel(MedicalRecord.name) private medicalRecordModel: Model<MedicalRecordDocument>,
        @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(ClinicConfig.name) private clinicConfigModel: Model<ClinicConfigDocument>,
        private profilesService: ProfilesService,
        private notificationService: NotificationService,
    ) { }

    // ==========================================
    //              CLINIC CRUD
    // ==========================================

    async createClinic(ownerId: string, dto: CreateClinicDto): Promise<ClinicDocument> {
        const clinic = new this.clinicModel({
            ...dto,
            ownerId: new Types.ObjectId(ownerId),
        });
        return clinic.save();
    }

    async getClinicByOwner(ownerId: string): Promise<ClinicDocument> {
        const clinic = await this.clinicModel.findOne({ ownerId: new Types.ObjectId(ownerId) }).exec();
        if (!clinic) throw new NotFoundException('Clinique non trouvée');
        return clinic;
    }

    async getAllClinics(): Promise<ClinicDocument[]> {
        return this.clinicModel.find().exec();
    }

    async getClinicById(clinicId: string): Promise<ClinicDocument> {
        const clinic = await this.clinicModel.findById(clinicId).exec();
        if (!clinic) throw new NotFoundException('Clinique non trouvée');
        return clinic;
    }

    async updateClinic(clinicId: string, dto: UpdateClinicDto): Promise<ClinicDocument> {
        const clinic = await this.clinicModel.findByIdAndUpdate(clinicId, dto, { new: true }).exec();
        if (!clinic) throw new NotFoundException('Clinique non trouvée');
        return clinic;
    }

    async deleteClinic(clinicId: string): Promise<{ message: string }> {
        await this.clinicModel.findByIdAndDelete(clinicId).exec();
        return { message: 'Clinique supprimée avec succès' };
    }

    /**
     * Récupère la clinique du user connecté.
     * Si elle n'existe pas encore (premier accès après invitation admin),
     * elle est créée automatiquement à partir du ClinicProfile existant.
     */
    async getOrCreateClinicByOwner(ownerId: string): Promise<ClinicDocument> {
        const ownerObjectId = new Types.ObjectId(ownerId);

        // 1. Chercher la clinique existante
        let clinic = await this.clinicModel.findOne({ ownerId: ownerObjectId }).exec();
        if (clinic) {
            // Backfill: si des champs sont vides, les remplir depuis le profil / user
            const needsBackfill = !clinic.email || !clinic.phoneNumber || !clinic.city;
            if (needsBackfill) {
                try {
                    const user = await this.userModel.findById(ownerObjectId).exec();
                    const profile = await this.profilesService.getProfile(ownerId, UserRole.CLINIQUE).catch(() => null) as any;
                    const updates: any = {};
                    if (!clinic.email) {
                        updates.email = profile?.officialEmail || user?.email || undefined;
                    }
                    if (!clinic.phoneNumber) {
                        updates.phoneNumber = profile?.phone || user?.phone || undefined;
                    }
                    if (!clinic.city && profile?.city) updates.city = profile.city;
                    if (!clinic.wilaya && profile?.wilaya) updates.wilaya = profile.wilaya;
                    if (Object.keys(updates).length > 0) {
                        clinic = await this.clinicModel.findByIdAndUpdate(clinic._id, updates, { new: true }).exec();
                    }
                } catch (_) { }
            }
            return clinic;
        }

        // 2. Lire le ClinicProfile + User pour pré-remplir un maximum de données
        let name = 'Ma Clinique';
        let address = 'À compléter';
        let email = '';
        let phoneNumber = '';
        let city = '';
        let wilaya = '';
        let description = '';

        // Récupérer les données de l'utilisateur (email, phone)
        try {
            const user = await this.userModel.findById(ownerObjectId).exec();
            if (user) {
                email = user.email || '';
                phoneNumber = user.phone || '';
            }
        } catch (_) { }

        // Récupérer les données du profil clinique (inscription)
        try {
            const profile = await this.profilesService.getProfile(ownerId, UserRole.CLINIQUE) as any;
            if (profile) {
                if (profile.clinicName) name = profile.clinicName;
                if (profile.address) address = profile.address;
                if (profile.city) city = profile.city;
                if (profile.wilaya) wilaya = profile.wilaya;
                // officialEmail du profil a priorité sur l'email du user
                if (profile.officialEmail) email = profile.officialEmail;
                if (profile.phone) phoneNumber = profile.phone;
            }
        } catch (_) { /* profil pas encore créé, on utilise les valeurs par défaut */ }

        // 3. Créer la clinique automatiquement avec toutes les données disponibles
        clinic = new this.clinicModel({
            ownerId: ownerObjectId,
            name,
            address,
            email: email || undefined,
            phoneNumber: phoneNumber || undefined,
            city: city || undefined,
            wilaya: wilaya || undefined,
            description: description || undefined,
        });
        return clinic.save();
    }

    /**
     * Récupère la clinique pour l'utilisateur connecté (propriétaire ou médecin assigné).
     * Permet de lier clinique et patient quand le médecin consulte un dossier.
     */
    async getClinicForUser(userId: string, role: string): Promise<ClinicDocument> {
        if (role === UserRole.CLINIQUE) {
            return this.getOrCreateClinicByOwner(userId);
        }
        if (role === UserRole.MEDECIN) {
            const link = await this.clinicDoctorModel
                .findOne({ doctorId: new Types.ObjectId(userId) })
                .exec();
            if (link?.clinicId) {
                return this.getClinicById((link.clinicId as any).toString());
            }
            throw new NotFoundException('Aucune clinique associée à ce médecin');
        }
        throw new NotFoundException('Rôle non autorisé pour accéder à une clinique');
    }

    // ==========================================
    //         DOCTOR MANAGEMENT (FK → Clinic)
    // ==========================================

    async addDoctorToClinic(clinicId: string, dto: AddDoctorToClinicDto): Promise<ClinicDoctorDocument> {
        await this.getClinicById(clinicId);

        const existing = await this.clinicDoctorModel.findOne({
            clinicId: new Types.ObjectId(clinicId),
            doctorId: new Types.ObjectId(dto.doctorId),
        }).exec();

        if (existing) {
            throw new BadRequestException('Ce médecin est déjà associé à cette clinique');
        }

        const clinicDoctor = new this.clinicDoctorModel({
            ...dto,
            clinicId: new Types.ObjectId(clinicId),
            doctorId: new Types.ObjectId(dto.doctorId),
        });
        return clinicDoctor.save();
    }

    async getDoctorsByClinic(clinicId: string): Promise<ClinicDoctorDocument[]> {
        return this.clinicDoctorModel
            .find({ clinicId: new Types.ObjectId(clinicId) })
            .populate('doctorId', 'email phone role')
            .exec();
    }

    async updateClinicDoctor(clinicDoctorId: string, dto: UpdateClinicDoctorDto): Promise<ClinicDoctorDocument> {
        const doc = await this.clinicDoctorModel.findByIdAndUpdate(clinicDoctorId, dto, { new: true }).exec();
        if (!doc) throw new NotFoundException('Médecin non trouvé dans cette clinique');
        return doc;
    }

    async removeDoctorFromClinic(clinicDoctorId: string): Promise<{ message: string }> {
        await this.clinicDoctorModel.findByIdAndDelete(clinicDoctorId).exec();
        return { message: 'Médecin retiré de la clinique' };
    }

    async getAvailableDoctors(): Promise<UserDocument[]> {
        return this.userModel.find({ role: 'medecin' }).select('_id email phone role').exec();
    }

    // ==========================================
    //       APPOINTMENTS (FK → Clinic, Doctor, Patient)
    // ==========================================

    async createAppointment(clinicId: string, dto: CreateAppointmentDto): Promise<AppointmentDocument> {
        await this.getClinicById(clinicId);
        
        let noShowProb = null;
        let riskLevel = null;
        let aiRecommendations = [];
        let aiDiseaseRisk = 'SAIN';
        let aiDiseaseLabel = '✅ Aucun risque majeur détecté';
        let aiDiseaseColor = 'green';
        let aiDiseaseConfidence = 0;

        let aiNlpDiagnosis = null;
        let aiNlpConfidence = 0;
        let aiNlpColor = 'green';
        let aiNlpTriage = null;
        let aiNlpPreparation = null;
        let aiNlpActionButton = null;

        try {
            // ═══ Récupérer le vrai dossier médical mobile ═══
            let patientInfo: any;
            try {
                if (dto.patientId) {
                    patientInfo = await this.profilesService.getProfile(dto.patientId, UserRole.PATIENT);
                }
            } catch (e) {}

            const realAge = patientInfo?.age || dto.patientAge || 30;
            const realGender = patientInfo?.gender === 'female' ? 'F' : (patientInfo?.gender === 'male' ? 'M' : (dto.patientGender || 'M'));
            const diseases = patientInfo?.chronicDiseases || [];
            const hasHipertension = diseases.some((d: string) => d.toLowerCase().includes('tension') || d.toLowerCase().includes('hypertension')) ? 1 : (dto.hipertension ?? 0);
            const hasDiabetes = diseases.some((d: string) => d.toLowerCase().includes('diab')) ? 1 : (dto.diabetes ?? 0);

            console.log(`[IA] Création RDV - Fetch depuis dossier mobile: ${patientInfo?.fullName || dto.patientName}`);

            // Fetch adherenceModelUrl dynamiquement depuis clinicConfig
            let aiUrl = 'http://localhost:5005';
            try {
                const config = await this.getClinicConfig(clinicId);
                if (config && config.adherenceModelUrl) {
                    aiUrl = config.adherenceModelUrl;
                }
            } catch (e) {}

            const response = await fetch(`${aiUrl}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gender: realGender,
                    age: realAge,
                    scholarship: 0,
                    hipertension: hasHipertension,
                    diabetes: hasDiabetes,
                    alcoholism: dto.alcoholism ?? 0,
                    handcap: dto.handcap ?? 0,
                    sms_received: dto.smsReceived ?? 1
                })
            });
            const data = await response.json();
            if (data.success) {
                noShowProb = data.noShowProbability;
                riskLevel = data.riskLevel || (noShowProb > 50 ? 'élevé' : noShowProb > 20 ? 'modéré' : 'faible');
                aiRecommendations = data.recommendations || [];
                
                // Génération de recommandations et raisons intelligentes si vide
                if (aiRecommendations.length === 0) {
                    if (noShowProb > 50) {
                        aiRecommendations.push(`Risque élevé de no-show (${Math.round(noShowProb)}%)`);
                        aiRecommendations.push('Un appel téléphonique préventif est fortement recommandé');
                    } else if (noShowProb > 20) {
                        aiRecommendations.push(`Risque modéré de no-show (${Math.round(noShowProb)}%)`);
                        aiRecommendations.push('Un rappel SMS est conseillé 24h avant');
                    } else {
                        aiRecommendations.push('Patient généralement ponctuel');
                        aiRecommendations.push('Aucune action requise');
                    }
                    if (hasHipertension || hasDiabetes) aiRecommendations.push(`Note: Patient avec comorbidités (suivi clinique important)`);
                    if (patientInfo?.allergies?.length > 0) aiRecommendations.push(`${patientInfo.allergies.length} allergie(s) connue(s) signalée(s)`);
                }
                
                console.log(`[IA] RDV Patient: ${dto.patientName} | Risk: ${noShowProb}% (${riskLevel})`);
            }
        } catch (error) {
            console.log('[IA] Service No-Show non disponible:', error.message);
        }

        try {
            let patientInfo: any;
            if (dto.patientId) patientInfo = await this.profilesService.getProfile(dto.patientId, UserRole.PATIENT);
            
            const config = await this.getClinicConfig(clinicId);
            const aiUrl = config?.adherenceModelUrl || 'http://localhost:5005';
            
            const payload = {
                Age: patientInfo?.age || 40,
                Gender: patientInfo?.gender === 'female' ? 'F' : 'M',
                BMI: patientInfo?.weight && patientInfo?.height ? (patientInfo.weight / Math.pow(patientInfo.height/100, 2)) : 25.0,
                SystolicBP: 120, // Par défaut si non fourni
                Glucose: 90,
                Cholesterol: 190,
                Smoking: patientInfo?.habits?.includes('smoking') ? 1 : 0
            };
            
            const responseDisease = await fetch(`${aiUrl}/predict/disease`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (responseDisease.ok) {
                const dataDisease = await responseDisease.json();
                if (dataDisease.success) {
                    aiDiseaseRisk = dataDisease.status;
                    aiDiseaseLabel = dataDisease.label;
                    aiDiseaseColor = dataDisease.color;
                    aiDiseaseConfidence = dataDisease.confidence;
                    if (dataDisease.explanations && Array.isArray(dataDisease.explanations)) {
                        aiRecommendations = [...aiRecommendations, ...dataDisease.explanations];
                    }
                }
            }
        } catch (e) {
            console.log('[IA] Service Disease non disponible:', e.message);
        }

        // --- 3. NLP Symptom Checker ---
        if (dto.reason && dto.reason.trim().length > 5) {
            try {
                const config = await this.getClinicConfig(clinicId);
                const aiUrl = config?.adherenceModelUrl || 'http://localhost:5005';
                const responseNlp = await fetch(`${aiUrl}/predict/nlp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symptoms: dto.reason })
                });
                
                if (responseNlp.ok) {
                    const dataNlp = await responseNlp.json();
                    if (dataNlp.success) {
                        aiNlpDiagnosis = dataNlp.diagnosis;
                        aiNlpColor = dataNlp.color;
                        aiNlpConfidence = dataNlp.confidence;
                        aiNlpTriage = dataNlp.triage;
                        aiNlpPreparation = dataNlp.preparation;
                        aiNlpActionButton = dataNlp.action_button;
                        console.log(`[IA] NLP Pré-Diag: ${aiNlpDiagnosis} (${aiNlpConfidence}%)`);
                    }
                }
            } catch (e) {
                console.log('[IA] Service NLP non disponible:', e.message);
            }
        }

        const appointment = new this.appointmentModel({
            ...dto,
            clinicId: new Types.ObjectId(clinicId),
            patientId: new Types.ObjectId(dto.patientId),
            date: new Date(dto.date),
            noShowProbability: noShowProb,
            riskLevel: riskLevel,
            aiRecommendations: aiRecommendations,
            aiDiseaseRisk,
            aiDiseaseLabel,
            aiDiseaseColor,
            aiDiseaseConfidence,
            aiNlpDiagnosis,
            aiNlpColor,
            aiNlpConfidence,
            aiNlpTriage,
            aiNlpPreparation,
            aiNlpActionButton
        });
        if (dto.doctorId && dto.doctorId.trim().length > 0) {
            appointment.doctorId = new Types.ObjectId(dto.doctorId);
        } else {
            appointment.doctorId = undefined;
        }
        return appointment.save();
    }

    async getAppointmentsByClinic(clinicId: string, filters?: { date?: string; status?: string; doctorId?: string; source?: string }): Promise<AppointmentDocument[]> {
        const query: any = { clinicId: new Types.ObjectId(clinicId) };

        if (filters?.date) query.date = { $gte: new Date(filters.date), $lt: new Date(new Date(filters.date).getTime() + 86400000) };
        if (filters?.status) query.status = filters.status;
        if (filters?.doctorId) query.doctorId = new Types.ObjectId(filters.doctorId);
        if (filters?.source) query.source = filters.source;

        return this.appointmentModel
            .find(query)
            .populate('doctorId', 'email phone')
            .populate('patientId', 'email phone')
            .sort({ date: 1, timeSlot: 1 })
            .exec();
    }

    async getAppointmentById(appointmentId: string): Promise<AppointmentDocument> {
        const appt = await this.appointmentModel
            .findById(appointmentId)
            .populate('doctorId', 'email phone')
            .populate('patientId', 'email phone')
            .exec();
        if (!appt) throw new NotFoundException('Rendez-vous non trouvé');
        return appt;
    }

    async updateAppointment(appointmentId: string, dto: UpdateAppointmentDto): Promise<AppointmentDocument> {
        const existingAppt = await this.getAppointmentById(appointmentId);
        const oldStatus = existingAppt.status;

        const updateData: any = { ...dto };
        if (dto.date) updateData.date = new Date(dto.date);

        const appt = await this.appointmentModel.findByIdAndUpdate(appointmentId, updateData, { new: true }).exec();
        if (!appt) throw new NotFoundException('Rendez-vous non trouvé');

        // Notification if status changed and it's an online booking
        if (dto.status && dto.status !== oldStatus && appt.source === 'mobile') {
            const clinic = await this.getClinicById(appt.clinicId.toString());
            let title = 'Mise à jour de votre rendez-vous';
            let message = `Votre rendez-vous à la clinique ${clinic.name} a été mis à jour.`;

            if (dto.status === AppointmentStatus.CONFIRMED) {
                title = 'Rendez-vous confirmé !';
                message = `Bonne nouvelle ! Votre rendez-vous à la clinique ${clinic.name} le ${appt.date.toLocaleDateString()} à ${appt.timeSlot} a été accepté.`;
            } else if (dto.status === AppointmentStatus.CANCELLED) {
                title = 'Rendez-vous refusé';
                message = `Désolé, votre demande de rendez-vous à la clinique ${clinic.name} a été refusée ou annulée.`;
            }

            await this.notificationService.createNotification({
                userId: appt.patientId.toString(),
                type: NotificationType.APPOINTMENT,
                title,
                message,
                relatedId: appt._id.toString(),
                data: { clinicId: clinic._id.toString(), status: dto.status }
            });
        }

        return appt;
    }

    async deleteAppointment(appointmentId: string): Promise<{ message: string }> {
        await this.appointmentModel.findByIdAndDelete(appointmentId).exec();
        return { message: 'Rendez-vous supprimé' };
    }

    // ==========================================
    //       ADMISSIONS (FK → Clinic, Patient, Doctor)
    // ==========================================

    async createAdmission(clinicId: string, dto: CreateAdmissionDto): Promise<AdmissionDocument> {
        await this.getClinicById(clinicId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const count = await this.admissionModel.countDocuments({
            clinicId: new Types.ObjectId(clinicId),
            date: { $gte: today, $lte: todayEnd },
        });

        // --- Triage IA ---
        let triageStatus = 'ROUTINE';
        let triageColor = 'green';
        let triageRecommendation = '🟢 ROUTINE — Suivre l\'ordre normal d\'arrivée';
        let triageConfidence = 0;
        
        try {
            const patientInfo = await this.profilesService.getProfile(dto.patientId, UserRole.PATIENT);
            const clinicConfig = await this.clinicConfigModel.findOne({ clinicId: new Types.ObjectId(clinicId) }).exec();
            const baseUrl = clinicConfig?.adherenceModelUrl || 'http://localhost:5005';
            
            // Simulation des constantes vitales en fonction du motif et de l'âge
            const age = patientInfo?.age || 35;
            const gender = patientInfo?.gender === 'female' ? 'F' : 'M';
            const reason = dto.reason?.toLowerCase() || '';
            const diseases = patientInfo?.chronicDiseases || [];
            
            let hr = 80, sbp = 120, temp = 37.0, osat = 98, pain = 2;
            
            if (reason.includes('urgence') || reason.includes('douleur')) {
                hr = 105; sbp = 145; pain = 7;
            } else if (reason.includes('fievre') || reason.includes('fièvre')) {
                temp = 39.0; hr = 95; pain = 4;
            } else if (reason.includes('malaise') || reason.includes('respiratoire')) {
                osat = 92; hr = 110; sbp = 95; pain = 5;
            }
            
            const payload = {
                Age: age,
                Gender: gender,
                HeartRate: hr,
                SystolicBP: sbp,
                Temperature: temp,
                OxygenSat: osat,
                Comorbidities: diseases.length,
                PainLevel: pain
            };
            
            const response = await fetch(`${baseUrl}/predict/triage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    triageStatus = data.triage_status;
                    triageColor = data.color;
                    triageRecommendation = data.recommendation;
                    triageConfidence = data.confidence;
                }
            }
        } catch (e) {
            console.log(`[Triage IA] Erreur appel modèle : ${e.message}`);
        }

        const admission = new this.admissionModel({
            ...dto,
            clinicId: new Types.ObjectId(clinicId),
            patientId: new Types.ObjectId(dto.patientId),
            doctorId: dto.doctorId ? new Types.ObjectId(dto.doctorId) : undefined,
            date: new Date(),
            queueNumber: count + 1,
            triageStatus,
            triageColor,
            triageRecommendation,
            triageConfidence
        });
        return admission.save();
    }

    async getAdmissionsByClinic(clinicId: string, filters?: { date?: string; status?: string }): Promise<AdmissionDocument[]> {
        const query: any = { clinicId: new Types.ObjectId(clinicId) };

        if (filters?.date) {
            const d = new Date(filters.date);
            d.setHours(0, 0, 0, 0);
            const dEnd = new Date(d);
            dEnd.setHours(23, 59, 59, 999);
            query.date = { $gte: d, $lte: dEnd };
        }
        if (filters?.status) query.status = filters.status;

        return this.admissionModel
            .find(query)
            .populate('patientId', 'email phone')
            .populate('doctorId', 'email phone')
            .sort({ queueNumber: 1 })
            .exec();
    }

    async updateAdmission(admissionId: string, dto: UpdateAdmissionDto): Promise<AdmissionDocument> {
        const updateData: any = { ...dto };
        if (dto.doctorId) updateData.doctorId = new Types.ObjectId(dto.doctorId);

        const adm = await this.admissionModel.findByIdAndUpdate(admissionId, updateData, { new: true }).exec();
        if (!adm) throw new NotFoundException('Admission non trouvée');
        return adm;
    }

    async deleteAdmission(admissionId: string): Promise<{ message: string }> {
        const adm = await this.admissionModel.findByIdAndDelete(admissionId).exec();
        if (!adm) throw new NotFoundException('Admission non trouvée');
        return { message: 'Admission supprimée avec succès' };
    }

    // ==========================================
    //       DOSSIER MÉDICAL (Medical Records)
    // ==========================================

    async createMedicalRecord(clinicId: string, dto: CreateMedicalRecordDto): Promise<MedicalRecordDocument> {
        await this.getClinicById(clinicId);

        const record = new this.medicalRecordModel({
            ...dto,
            clinicId: new Types.ObjectId(clinicId),
            patientId: new Types.ObjectId(dto.patientId),
            doctorId: new Types.ObjectId(dto.doctorId),
            appointmentId: dto.appointmentId ? new Types.ObjectId(dto.appointmentId) : undefined,
            date: new Date(),
        });

        return record.save();
    }

    async getMedicalRecordsByClinic(clinicId: string, filters?: { patientId?: string; doctorId?: string; type?: string }): Promise<MedicalRecordDocument[]> {
        const query: any = { clinicId: new Types.ObjectId(clinicId) };

        if (filters?.patientId) query.patientId = new Types.ObjectId(filters.patientId);
        if (filters?.doctorId) query.doctorId = new Types.ObjectId(filters.doctorId);
        if (filters?.type) query.type = filters.type;

        return this.medicalRecordModel
            .find(query)
            .populate('patientId', 'email phone')
            .populate('doctorId', 'email phone')
            .sort({ date: -1 })
            .exec();
    }

    async getMedicalRecordById(recordId: string): Promise<MedicalRecordDocument> {
        const record = await this.medicalRecordModel
            .findById(recordId)
            .populate('patientId', 'email phone')
            .populate('doctorId', 'email phone')
            .exec();
        if (!record) throw new NotFoundException('Dossier médical non trouvé');
        return record;
    }

    async getPatientMedicalHistory(patientId: string): Promise<MedicalRecordDocument[]> {
        return this.medicalRecordModel
            .find({ patientId: new Types.ObjectId(patientId) })
            .populate('clinicId', 'name address')
            .populate('doctorId', 'email phone')
            .sort({ date: -1 })
            .exec();
    }

    async updateMedicalRecord(recordId: string, dto: UpdateMedicalRecordDto): Promise<MedicalRecordDocument> {
        const record = await this.medicalRecordModel.findByIdAndUpdate(recordId, dto, { new: true }).exec();
        if (!record) throw new NotFoundException('Dossier médical non trouvé');
        return record;
    }

    async deleteMedicalRecord(recordId: string): Promise<{ message: string }> {
        const record = await this.medicalRecordModel.findByIdAndDelete(recordId).exec();
        if (!record) throw new NotFoundException('Dossier médical non trouvé');
        return { message: 'Dossier médical supprimé avec succès' };
    }

    // ==========================================
    //       FACTURATION (Invoices)
    // ==========================================

    private async generateInvoiceNumber(clinicId: string): Promise<string> {
        const year = new Date().getFullYear();
        const lastInvoice = await this.invoiceModel
            .findOne({ clinicId: new Types.ObjectId(clinicId) })
            .sort({ createdAt: -1 })
            .exec();

        let nextNum = 1;
        if (lastInvoice && lastInvoice.invoiceNumber) {
            const parts = lastInvoice.invoiceNumber.split('-');
            const lastNum = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }

        const numStr = String(nextNum).padStart(4, '0');
        return `FAC-${year}-${numStr}`;
    }

    async createInvoice(clinicId: string, dto: CreateInvoiceDto): Promise<InvoiceDocument> {
        await this.getClinicById(clinicId);

        // Calculer les totaux
        const items = dto.items.map(item => ({
            ...item,
            quantity: item.quantity || 1,
            total: (item.quantity || 1) * item.unitPrice,
        }));

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        let totalAmount = subtotal;

        // Appliquer la remise
        if (dto.discountPercentage) {
            totalAmount -= (subtotal * dto.discountPercentage / 100);
        } else if (dto.discount) {
            totalAmount -= dto.discount;
        }

        // Ajouter la TVA
        if (dto.tax) {
            totalAmount += (totalAmount * dto.tax / 100);
        }

        const invoiceNumber = await this.generateInvoiceNumber(clinicId);

        const invoice = new this.invoiceModel({
            invoiceNumber,
            clinicId: new Types.ObjectId(clinicId),
            patientId: new Types.ObjectId(dto.patientId),
            doctorId: dto.doctorId ? new Types.ObjectId(dto.doctorId) : undefined,
            appointmentId: dto.appointmentId ? new Types.ObjectId(dto.appointmentId) : undefined,
            medicalRecordId: dto.medicalRecordId ? new Types.ObjectId(dto.medicalRecordId) : undefined,
            date: new Date(),
            items,
            subtotal,
            discount: dto.discount || 0,
            discountPercentage: dto.discountPercentage || 0,
            tax: dto.tax || 0,
            totalAmount: Math.round(totalAmount),
            amountPaid: 0,
            amountDue: Math.round(totalAmount),
            paymentStatus: 'pending',
            paymentMethod: dto.paymentMethod,
            insuranceDetails: dto.insuranceDetails,
            patientName: dto.patientName,
            doctorName: dto.doctorName,
            notes: dto.notes,
        });
        return invoice.save();
    }

    async getInvoicesByClinic(clinicId: string, filters?: { paymentStatus?: string; patientId?: string; startDate?: string; endDate?: string }): Promise<InvoiceDocument[]> {
        const query: any = { clinicId: new Types.ObjectId(clinicId) };

        if (filters?.paymentStatus) query.paymentStatus = filters.paymentStatus;
        if (filters?.patientId) query.patientId = new Types.ObjectId(filters.patientId);
        if (filters?.startDate || filters?.endDate) {
            query.date = {};
            if (filters.startDate) query.date.$gte = new Date(filters.startDate);
            if (filters.endDate) query.date.$lte = new Date(filters.endDate);
        }

        return this.invoiceModel
            .find(query)
            .populate('patientId', 'email phone')
            .populate('doctorId', 'email phone')
            .sort({ date: -1 })
            .exec();
    }

    async getInvoiceById(invoiceId: string): Promise<InvoiceDocument> {
        const invoice = await this.invoiceModel
            .findById(invoiceId)
            .populate('patientId', 'email phone')
            .populate('doctorId', 'email phone')
            .exec();
        if (!invoice) throw new NotFoundException('Facture non trouvée');
        return invoice;
    }

    async updateInvoice(invoiceId: string, dto: UpdateInvoiceDto): Promise<InvoiceDocument> {
        const invoice = await this.invoiceModel.findById(invoiceId).exec();
        if (!invoice) throw new NotFoundException('Facture non trouvée');

        // Mettre à jour le paiement
        if (dto.amountPaid !== undefined) {
            const newAmountPaid = dto.amountPaid;
            const amountDue = invoice.totalAmount - newAmountPaid;

            let paymentStatus = 'pending';
            if (newAmountPaid >= invoice.totalAmount) {
                paymentStatus = 'paid';
            } else if (newAmountPaid > 0) {
                paymentStatus = 'partial';
            }

            Object.assign(dto, {
                amountPaid: newAmountPaid,
                amountDue: Math.max(0, amountDue),
                paymentStatus,
                paidAt: paymentStatus === 'paid' ? new Date() : undefined,
            });
        }

        const updated = await this.invoiceModel.findByIdAndUpdate(invoiceId, dto, { new: true }).exec();
        if (!updated) throw new NotFoundException('Facture non trouvée');
        return updated;
    }

    async deleteInvoice(invoiceId: string): Promise<{ message: string }> {
        const invoice = await this.invoiceModel.findByIdAndDelete(invoiceId).exec();
        if (!invoice) throw new NotFoundException('Facture non trouvée');
        return { message: 'Facture supprimée avec succès' };
    }

    // ==========================================
    //        DASHBOARD PROFESSIONNEL ENRICHI
    // ==========================================

    async getDashboardStats(clinicId: string) {
        const objectId = new Types.ObjectId(clinicId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        // Début du mois courant
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        // Début de la semaine (lundi)
        const weekStart = new Date(today);
        const dayOfWeek = today.getDay() || 7;
        weekStart.setDate(today.getDate() - dayOfWeek + 1);
        weekStart.setHours(0, 0, 0, 0);

        // Mois précédent
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

        const [
            // Stats de base
            totalDoctors,
            activeDoctors,
            totalAppointmentsToday,
            totalAdmissionsToday,
            pendingAppointments,
            // Stats étendues
            totalAppointmentsMonth,
            totalAppointmentsLastMonth,
            completedAppointmentsMonth,
            cancelledAppointmentsMonth,
            noShowAppointmentsMonth,
            totalMedicalRecords,
            totalMedicalRecordsMonth,
            // Stats financières
            totalInvoicesMonth,
            paidInvoicesMonth,
            pendingInvoicesMonth,
            // Admissions aujourd'hui par statut
            waitingAdmissions,
            inConsultationAdmissions,
            completedAdmissionsToday,
        ] = await Promise.all([
            // Stats de base
            this.clinicDoctorModel.countDocuments({ clinicId: objectId }),
            this.clinicDoctorModel.countDocuments({ clinicId: objectId, status: 'active' }),
            this.appointmentModel.countDocuments({ clinicId: objectId, date: { $gte: today, $lte: todayEnd } }),
            this.admissionModel.countDocuments({ clinicId: objectId, date: { $gte: today, $lte: todayEnd } }),
            this.appointmentModel.countDocuments({ clinicId: objectId, status: 'pending' }),
            // Stats étendues
            this.appointmentModel.countDocuments({ clinicId: objectId, date: { $gte: monthStart, $lte: monthEnd } }),
            this.appointmentModel.countDocuments({ clinicId: objectId, date: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
            this.appointmentModel.countDocuments({ clinicId: objectId, status: 'completed', date: { $gte: monthStart, $lte: monthEnd } }),
            this.appointmentModel.countDocuments({ clinicId: objectId, status: 'cancelled', date: { $gte: monthStart, $lte: monthEnd } }),
            this.appointmentModel.countDocuments({ clinicId: objectId, status: 'no_show', date: { $gte: monthStart, $lte: monthEnd } }),
            this.medicalRecordModel.countDocuments({ clinicId: objectId }),
            this.medicalRecordModel.countDocuments({ clinicId: objectId, date: { $gte: monthStart, $lte: monthEnd } }),
            // Stats financières
            this.invoiceModel.countDocuments({ clinicId: objectId, date: { $gte: monthStart, $lte: monthEnd } }),
            this.invoiceModel.countDocuments({ clinicId: objectId, paymentStatus: 'paid', date: { $gte: monthStart, $lte: monthEnd } }),
            this.invoiceModel.countDocuments({ clinicId: objectId, paymentStatus: 'pending', date: { $gte: monthStart, $lte: monthEnd } }),
            // Admissions
            this.admissionModel.countDocuments({ clinicId: objectId, status: 'waiting', date: { $gte: today, $lte: todayEnd } }),
            this.admissionModel.countDocuments({ clinicId: objectId, status: 'in_consultation', date: { $gte: today, $lte: todayEnd } }),
            this.admissionModel.countDocuments({ clinicId: objectId, status: 'completed', date: { $gte: today, $lte: todayEnd } }),
        ]);

        // Revenus du mois (agrégation)
        const revenueAgg = await this.invoiceModel.aggregate([
            {
                $match: {
                    clinicId: objectId,
                    date: { $gte: monthStart, $lte: monthEnd },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    totalPaid: { $sum: '$amountPaid' },
                    totalDue: { $sum: '$amountDue' },
                },
            },
        ]);

        // Revenus du mois dernier
        const lastMonthRevenueAgg = await this.invoiceModel.aggregate([
            {
                $match: {
                    clinicId: objectId,
                    date: { $gte: lastMonthStart, $lte: lastMonthEnd },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                },
            },
        ]);

        // Top 5 médecins par consultations ce mois
        const topDoctors = await this.appointmentModel.aggregate([
            {
                $match: {
                    clinicId: objectId,
                    date: { $gte: monthStart, $lte: monthEnd },
                    status: { $in: ['completed', 'confirmed', 'in_progress'] },
                },
            },
            {
                $group: {
                    _id: '$doctorId',
                    consultations: { $sum: 1 },
                    doctorName: { $first: '$doctorName' },
                },
            },
            { $sort: { consultations: -1 } },
            { $limit: 5 },
        ]);

        // Répartition des RDV par jour de la semaine (ce mois)
        const appointmentsByDay = await this.appointmentModel.aggregate([
            {
                $match: {
                    clinicId: objectId,
                    date: { $gte: monthStart, $lte: monthEnd },
                },
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$date' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Répartition des types de dossiers médicaux
        const recordsByType = await this.medicalRecordModel.aggregate([
            {
                $match: {
                    clinicId: objectId,
                    date: { $gte: monthStart, $lte: monthEnd },
                },
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                },
            },
        ]);

        // Revenus par jour (7 derniers jours)
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        const revenueByDay = await this.invoiceModel.aggregate([
            {
                $match: {
                    clinicId: objectId,
                    date: { $gte: sevenDaysAgo, $lte: todayEnd },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        day: { $dayOfMonth: '$date' },
                    },
                    revenue: { $sum: '$totalAmount' },
                    paid: { $sum: '$amountPaid' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        ]);

        // Derniers RDV (pour l'activité récente)
        const recentAppointments = await this.appointmentModel
            .find({ clinicId: objectId })
            .sort({ createdAt: -1 })
            .limit(5)
            .exec();

        // Dernières factures
        const recentInvoices = await this.invoiceModel
            .find({ clinicId: objectId })
            .sort({ createdAt: -1 })
            .limit(5)
            .exec();

        const revenue = revenueAgg[0] || { totalRevenue: 0, totalPaid: 0, totalDue: 0 };
        const lastMonthRevenue = lastMonthRevenueAgg[0]?.totalRevenue || 0;

        // Calcul des tendances (% de variation)
        const appointmentsTrend = totalAppointmentsLastMonth > 0
            ? Math.round(((totalAppointmentsMonth - totalAppointmentsLastMonth) / totalAppointmentsLastMonth) * 100)
            : 0;
        const revenueTrend = lastMonthRevenue > 0
            ? Math.round(((revenue.totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
            : 0;

        // Taux de complétion
        const completionRate = totalAppointmentsMonth > 0
            ? Math.round((completedAppointmentsMonth / totalAppointmentsMonth) * 100)
            : 0;
        const cancellationRate = totalAppointmentsMonth > 0
            ? Math.round((cancelledAppointmentsMonth / totalAppointmentsMonth) * 100)
            : 0;
        const noShowRate = totalAppointmentsMonth > 0
            ? Math.round((noShowAppointmentsMonth / totalAppointmentsMonth) * 100)
            : 0;

        const highRiskAdherenceCount = await this.medicalRecordModel.countDocuments({
            clinicId: objectId,
            requiresFollowUpCall: true,
            date: { $gte: monthStart, $lte: monthEnd }
        });

        const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

        return {
            // ===== KPIs PRINCIPAUX =====
            overview: {
                totalDoctors,
                activeDoctors,
                totalAppointmentsToday,
                totalAdmissionsToday,
                pendingAppointments,
                totalMedicalRecords,
                highRiskAdherencePatients: highRiskAdherenceCount, // <-- KPI de l'IA
            },

            // ===== ADMISSIONS DU JOUR =====
            admissionsToday: {
                total: totalAdmissionsToday,
                waiting: waitingAdmissions,
                inConsultation: inConsultationAdmissions,
                completed: completedAdmissionsToday,
            },

            // ===== STATISTIQUES MENSUELLES =====
            monthly: {
                appointments: {
                    total: totalAppointmentsMonth,
                    completed: completedAppointmentsMonth,
                    cancelled: cancelledAppointmentsMonth,
                    noShow: noShowAppointmentsMonth,
                    completionRate,
                    cancellationRate,
                    noShowRate,
                    trend: appointmentsTrend,
                    trendLabel: appointmentsTrend >= 0 ? `+${appointmentsTrend}%` : `${appointmentsTrend}%`,
                },
                medicalRecords: totalMedicalRecordsMonth,
            },

            // ===== FINANCES =====
            finance: {
                totalRevenue: revenue.totalRevenue,
                totalPaid: revenue.totalPaid,
                totalDue: revenue.totalDue,
                invoicesCount: totalInvoicesMonth,
                paidInvoices: paidInvoicesMonth,
                pendingInvoices: pendingInvoicesMonth,
                trend: revenueTrend,
                trendLabel: revenueTrend >= 0 ? `+${revenueTrend}%` : `${revenueTrend}%`,
                revenueByDay: revenueByDay.map(r => ({
                    date: `${r._id.year}-${String(r._id.month).padStart(2, '0')}-${String(r._id.day).padStart(2, '0')}`,
                    revenue: r.revenue,
                    paid: r.paid,
                    invoices: r.count,
                })),
            },

            // ===== ANALYTICS =====
            analytics: {
                topDoctors: topDoctors.map(d => ({
                    doctorId: d._id,
                    doctorName: d.doctorName || 'Non renseigné',
                    consultations: d.consultations,
                })),
                appointmentsByDay: appointmentsByDay.map(d => ({
                    day: dayNames[d._id - 1] || 'Inconnu',
                    count: d.count,
                })),
                recordsByType: recordsByType.map(r => ({
                    type: r._id,
                    count: r.count,
                })),
            },

            // ===== ACTIVITÉ RÉCENTE =====
            recentActivity: {
                appointments: recentAppointments.map(a => ({
                    id: a._id,
                    patientName: a.patientName,
                    doctorName: a.doctorName,
                    date: a.date,
                    timeSlot: a.timeSlot,
                    status: a.status,
                })),
                invoices: recentInvoices.map(i => ({
                    id: i._id,
                    invoiceNumber: i.invoiceNumber,
                    patientName: i.patientName,
                    totalAmount: i.totalAmount,
                    paymentStatus: i.paymentStatus,
                    date: i.date,
                })),
            },
        };
    }

    // ==========================================
    //       CONFIGURATION CLINIQUE IA
    // ==========================================

    async getClinicConfig(clinicId: string): Promise<ClinicConfigDocument> {
        let config = await this.clinicConfigModel.findOne({ clinicId: new Types.ObjectId(clinicId) }).exec();
        if (!config) {
            config = new this.clinicConfigModel({ clinicId: new Types.ObjectId(clinicId) });
            await config.save();
        }
        return config;
    }

    async updateClinicConfig(clinicId: string, adherenceModelUrl: string): Promise<ClinicConfigDocument> {
        return this.clinicConfigModel.findOneAndUpdate(
            { clinicId: new Types.ObjectId(clinicId) },
            { adherenceModelUrl },
            { upsert: true, new: true }
        ).exec();
    }

    /**
     * Déclenche une analyse IA sur tous les dossiers non encore analysés de la clinique.
     * Cette méthode est appelée uniquement par l'administrateur de la clinique.
     */
    async triggerAdherenceAnalysis(clinicId: string): Promise<{ analyzed: number; highRisk: number }> {
        const config = await this.getClinicConfig(clinicId);
        
        // Nettoyer les anciens résultats IA auto-générés pour re-analyser
        await this.medicalRecordModel.deleteMany({
            clinicId: new Types.ObjectId(clinicId),
            diagnosis: 'Analyse IA automatique'
        }).exec();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // ═══════════════════════════════════════════
        //  LOGIQUE CLINIQUE RÉELLE
        //  1. Récupérer TOUS les RDV (en ligne + clinique)
        //  2. Récupérer les admissions (salle d'attente)
        //  3. Croiser pour détecter : présent, no-show, walk-in
        // ═══════════════════════════════════════════

        // 1. Tous les RDV confirmés/acceptés des 30 derniers jours
        const appointments = await this.appointmentModel.find({
            clinicId: new Types.ObjectId(clinicId),
            status: { $in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED, AppointmentStatus.PENDING, AppointmentStatus.IN_PROGRESS, 'confirmed', 'accepted', 'pending', 'completed'] },
            date: { $gte: thirtyDaysAgo }
        }).exec();

        // 2. Admissions d'aujourd'hui (salle d'attente)
        const admissions = await this.admissionModel.find({
            clinicId: new Types.ObjectId(clinicId),
            date: { $gte: today }
        }).exec();

        // 3. Créer un Set des patients admis aujourd'hui (ils sont venus)
        const admittedPatientIds = new Set<string>();
        for (const a of admissions) {
            if (a.patientId) admittedPatientIds.add(a.patientId.toString());
        }

        // 4. Construire la map complète des patients avec leur statut clinique
        interface PatientAnalysis {
            name: string;
            source: string;
            hasAppointment: boolean;
            isAdmitted: boolean;
            appointmentDate?: Date;
            isOnline: boolean;
            noShowRisk: boolean; // RDV passé + pas admis
        }
        const patientMap = new Map<string, PatientAnalysis>();

        // D'abord les RDV (source principale)
        for (const apt of appointments) {
            const id = apt.patientId?.toString();
            if (!id) continue;
            
            let name = apt.patientName || '';
            try {
                const user = await this.userModel.findById(id).select('fullName email').exec();
                if (user?.fullName) name = user.fullName;
                else if (user?.email) name = user.email;
            } catch (_) {}
            if (!name) name = `Patient ${patientMap.size + 1}`;

            const isOnline = apt.source === 'mobile';
            const isAdmitted = admittedPatientIds.has(id);
            const aptDate = new Date(apt.date);
            const isToday = aptDate >= today;
            const isPast = aptDate < today;
            
            // No-show = RDV confirmé dans le passé + pas admis aujourd'hui
            const noShowRisk = isPast && !isAdmitted && apt.status !== AppointmentStatus.COMPLETED;

            patientMap.set(id, {
                name,
                source: isOnline ? 'RDV en ligne 📱' : 'RDV clinique',
                hasAppointment: true,
                isAdmitted,
                appointmentDate: apt.date,
                isOnline,
                noShowRisk,
            });
        }

        // Ensuite les admissions (walk-in = pas de RDV)
        for (const a of admissions) {
            const id = a.patientId?.toString();
            if (!id || patientMap.has(id)) {
                // Patient déjà dans la map (via RDV), mettre à jour isAdmitted
                if (id && patientMap.has(id)) {
                    patientMap.get(id)!.isAdmitted = true;
                    patientMap.get(id)!.noShowRisk = false;
                }
                continue;
            }
            
            let name = (a as any).patientName || '';
            try {
                const user = await this.userModel.findById(id).select('fullName email').exec();
                if (user?.fullName) name = user.fullName;
                else if (user?.email) name = user.email;
            } catch (_) {}
            if (!name) name = `Patient ${patientMap.size + 1}`;

            // Walk-in : admis sans RDV préalable
            patientMap.set(id, {
                name,
                source: 'Walk-in (sans RDV)',
                hasAppointment: false,
                isAdmitted: true,
                isOnline: false,
                noShowRisk: false,
            });
        }

        console.log(`[IA CLINIQUE] 📊 Clinique ${clinicId}:`);
        console.log(`  → ${appointments.length} RDV trouvés (30 jours)`);
        console.log(`  → ${admissions.length} admissions aujourd'hui`);
        console.log(`  → ${patientMap.size} patients uniques à analyser`);

        let analyzeCount = 0;
        let highRiskCount = 0;
        let patientIndex = 0;

        for (const [pidStr, patientData] of patientMap) {
            const pid = new Types.ObjectId(pidStr);
            const { name: patientName, source: patientSource } = patientData;
            try {
                let record = await this.medicalRecordModel.findOne({ patientId: pid }).sort({ createdAt: -1 }).exec();
                
                // ═══ Récupérer les VRAIS données du profil patient mobile ═══
                let patientInfo: any;
                try {
                    patientInfo = await this.profilesService.getProfile(pidStr, UserRole.PATIENT);
                } catch (e) {}

                // Index déterministe pour une génération de données stable d'un clic à l'autre
                let pIdx = 0;
                for (let i = 0; i < pidStr.length; i++) {
                    pIdx += pidStr.charCodeAt(i);
                }
                pIdx = pIdx % 10;

                // ═══ Construire le payload NO-SHOW (même modèle que les RDV) ═══
                const hasRealProfile = !!patientInfo?.age;
                const baseAge = patientInfo?.age || (25 + ((pIdx % 5) * 8));
                const realGender = patientInfo?.gender === 'female' ? 'F' : (patientInfo?.gender === 'male' ? 'M' : (pIdx % 2 === 0 ? 'M' : 'F'));
                const diseases = patientInfo?.chronicDiseases || [];
                const hasHipertension = diseases.some((d: string) => d.toLowerCase().includes('tension') || d.toLowerCase().includes('hypertension')) ? 1 : 0;
                const hasDiabetes = diseases.some((d: string) => d.toLowerCase().includes('diab')) ? 1 : 0;
                const hasAlcoholism = diseases.some((d: string) => d.toLowerCase().includes('alcool')) ? 1 : 0;
                const comorb = diseases.length || 0;
                const allergies = patientInfo?.allergies?.length || 0;
                const smsReceived = patientData.isOnline ? 1 : 0; // RDV en ligne = rappel automatique

                const payload = {
                    gender: realGender,
                    age: baseAge,
                    scholarship: 0,
                    hipertension: hasHipertension,
                    diabetes: hasDiabetes,
                    alcoholism: hasAlcoholism,
                    handcap: 0,
                    sms_received: smsReceived,
                };

                console.log(`[IA CLINIQUE] 📊 ${patientName} | ${patientSource} | Admis: ${patientData.isAdmitted ? '✅' : '❌'} | No-show: ${patientData.noShowRisk ? '⚠️' : '—'} | ${hasRealProfile ? 'Profil réel' : 'Estimé'}`);

                // ═══ Appel au modèle NO-SHOW (même endpoint que les RDV) ═══
                let data: any = null;
                try {
                    const response = await fetch(`${config.adherenceModelUrl}/predict`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (response.ok) {
                        const raw = await response.json();
                        if (raw.success) {
                            // Convertir la réponse /predict en format compatible dashboard
                            const noShowProb = raw.noShowProbability || 0;
                            let riskStatus = 'ADHERENT_STABLE';
                            if (noShowProb >= 60) riskStatus = 'RISQUE_ELEVÉ_ABANDON';
                            else if (noShowProb >= 35) riskStatus = 'RISQUE_MODÉRÉ';

                            data = {
                                risk_status: riskStatus,
                                adherence_probability: noShowProb, // Score de no-show direct
                                risk_factors: raw.riskFactors || [],
                                recommendation: raw.recommendations?.[0] || '',
                                confidence: raw.confidence || Math.round(Math.max(noShowProb, 100 - noShowProb)),
                            };
                            console.log(`[IA] ✅ Modèle No-Show répondu pour ${patientName}: ${noShowProb}%`);
                        }
                    }
                } catch (fetchErr) {
                    console.log(`[IA] ⚠️ Modèle IA indisponible pour ${patientName}, utilisation du fallback`);
                }

                // ═══ FALLBACK si modèle indisponible ═══
                if (!data) {
                    const riskScore = Math.max(5, Math.min(95, 
                        20 + (patientData.noShowRisk ? 30 : 0) + (comorb * 5) + (baseAge > 55 ? 10 : 0) + (baseAge < 25 ? 12 : 0) - (patientData.isAdmitted ? 15 : 0) - (smsReceived * 8) + (hasAlcoholism * 15)
                    ));
                    const isHighRisk = riskScore > 60;
                    data = {
                        risk_status: isHighRisk ? 'RISQUE_ELEVÉ_ABANDON' : (riskScore > 35 ? 'RISQUE_MODÉRÉ' : 'ADHERENT_STABLE'),
                        adherence_probability: riskScore,
                        risk_factors: [],
                        recommendation: '',
                        confidence: Math.round(Math.max(riskScore, 100 - riskScore)),
                    };
                    console.log(`[IA] 🔄 Fallback pour ${patientName}: ${riskScore}% (${data.risk_status})`);
                }

                {
                    const isRisky = data.risk_status === "RISQUE_ELEVÉ_ABANDON";
                    const isMod = data.risk_status === "RISQUE_MODÉRÉ";
                    
                    // Facteurs de risque — utiliser ceux du modèle si disponibles
                    let factors: string[] = data.risk_factors || [];
                    if (factors.length === 0) {
                        if (baseAge >= 18 && baseAge <= 25) factors.push(`Jeune adulte (${baseAge} ans) — tranche à risque élevé de no-show`);
                        if (baseAge > 65) factors.push(`Patient âgé (${baseAge} ans) — mobilité réduite`);
                        if (comorb >= 2) factors.push(`${comorb} comorbidités détectées — suivi renforcé`);
                        if (hasHipertension) factors.push(`Hypertension artérielle — suivi tensionnel nécessaire`);
                        if (hasDiabetes) factors.push(`Diabète — contrôle glycémique essentiel`);
                        if (hasAlcoholism) factors.push(`Alcoolisme — facteur de non-adhérence significatif`);
                        if (!smsReceived) factors.push(`Aucun SMS de rappel programmé`);
                        if (factors.length === 0 && isRisky) factors.push(`Profil statistiquement à risque de no-show`);
                        if (factors.length === 0) factors.push(`Aucun facteur de risque majeur identifié`);
                    }

                    // Facteurs cliniques croisés
                    if (patientData.noShowRisk) factors.push(`⚠️ Historique no-show détecté`);
                    if (patientData.isAdmitted && patientData.hasAppointment) factors.push(`✅ Présent — RDV honoré`);
                    if (!patientData.hasAppointment && patientData.isAdmitted) factors.push(`🚶 Walk-in sans RDV préalable`);
                    if (patientData.isOnline) factors.push(`📱 Réservation via l'application`);
                    if (allergies > 0) factors.push(`${allergies} allergie(s) connue(s)`);
                    if (patientInfo?.chronicDiseases?.length > 0) {
                        factors.push(`Pathologies: ${patientInfo.chronicDiseases.slice(0, 2).join(', ')}`);
                    }
                    factors.push(`Source: ${patientSource}`);

                    // Recommandation clinique
                    let recommendation = data.recommendation || '';
                    if (!recommendation) {
                        if (patientData.noShowRisk) recommendation = '🔴 ALERTE — Patient absent à son dernier RDV. Appel téléphonique immédiat requis';
                        else if (isRisky && comorb >= 2) recommendation = '🔴 Patient poly-pathologique à risque élevé — Suivi rapproché avec rappels SMS';
                        else if (isRisky) recommendation = '🔴 Risque élevé de no-show — Contacter le patient par téléphone pour confirmer';
                        else if (isMod) recommendation = '🟡 VIGILANCE — Envoyer un SMS de rappel 24h avant le rendez-vous';
                        else if (!patientData.hasAppointment) recommendation = '📋 Walk-in sans RDV — Proposer un suivi régulier planifié';
                        else recommendation = '🟢 Patient stable — Maintenir le suivi standard';
                    }

                    const conf = data.confidence || Math.round(Math.max(data.adherence_probability, 100 - data.adherence_probability));

                    if (!record) {
                        record = new this.medicalRecordModel({
                             clinicId: new Types.ObjectId(clinicId),
                             patientId: pid,
                             doctorId: new Types.ObjectId(),
                             date: new Date(),
                             diagnosis: 'Analyse IA automatique',
                        });
                    }

                    record.patientName = patientName;
                    record.adherenceRiskStatus = data.risk_status;
                    record.adherenceRiskScore = data.adherence_probability;
                    record.requiresFollowUpCall = isRisky;
                    record.riskFactors = factors;
                    record.aiRecommendation = recommendation;
                    record.aiConfidence = conf;
                    record.lastAiAnalysisDate = new Date();
                    
                    await record.save();
                    analyzeCount++;
                    if (isRisky) highRiskCount++;
                    
                    console.log(`[IA DEBUG] ✅ ${patientName} → ${data.risk_status} (${data.adherence_probability}%) | ${factors.join(' • ')}`);
                }
            } catch (e) {
                console.error(`[IA Debug Error] Patient ${patientName}: ${e.message}`);
            }
            patientIndex++;
        }

        return { analyzed: analyzeCount, highRisk: highRiskCount };
    }

    // ==========================================
    //       RÉSULTATS IA (AI Results)
    // ==========================================

    async getAiAnalysisResults(clinicId: string): Promise<any[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const appointments = await this.appointmentModel.find({
            clinicId: new Types.ObjectId(clinicId),
            date: { $gte: today },
            status: AppointmentStatus.CONFIRMED
        })
        .sort({ date: 1, timeSlot: 1 })
        .limit(50)
        .exec();

        const results = [];
        for (const app of appointments) {
            let patientName = app.patientName || 'Patient';
            if (patientName === 'Patient') {
                try {
                    const user = await this.userModel.findById(app.patientId).select('fullName email').exec();
                    if (user?.fullName) patientName = user.fullName;
                    else if (user?.email) patientName = user.email;
                } catch (_) {}
            }

            results.push({
                appointmentId: app._id,
                patientId: app.patientId,
                patientName,
                date: app.date,
                timeSlot: app.timeSlot,
                diseaseRisk: app.aiDiseaseRisk || 'SAIN',
                diseaseLabel: app.aiDiseaseLabel || '✅ Aucun risque majeur détecté',
                diseaseColor: app.aiDiseaseColor || 'green',
                diseaseConfidence: app.aiDiseaseConfidence || 0,
                explanations: app.aiRecommendations || [],
                // Fallback for frontend compatibility just in case
                riskScore: app.aiDiseaseConfidence || 0,
                riskLevel: app.aiDiseaseColor === 'red' ? 'élevé' : (app.aiDiseaseColor === 'orange' ? 'modéré' : 'faible'),
                
                // NLP Fields
                nlpDiagnosis: app.aiNlpDiagnosis || null,
                nlpColor: app.aiNlpColor || 'green',
                nlpConfidence: app.aiNlpConfidence || 0,
                nlpTriage: app.aiNlpTriage || null,
                nlpPreparation: app.aiNlpPreparation || null,
                nlpActionButton: app.aiNlpActionButton || null,
                symptomsText: app.reason || null
            });
        }

        return results;
    }
}
