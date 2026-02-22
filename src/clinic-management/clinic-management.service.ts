import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Clinic, ClinicDocument } from './schemas/clinic.schema';
import { ClinicDoctor, ClinicDoctorDocument } from './schemas/clinic-doctor.schema';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { Admission, AdmissionDocument } from './schemas/admission.schema';
import { MedicalRecord, MedicalRecordDocument } from './schemas/medical-record.schema';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { CreateClinicDto, UpdateClinicDto } from './dto/clinic.dto';
import { AddDoctorToClinicDto, UpdateClinicDoctorDto } from './dto/clinic-doctor.dto';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';
import { CreateAdmissionDto, UpdateAdmissionDto } from './dto/admission.dto';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from './dto/medical-record.dto';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { User, UserDocument } from '../users/schemas/user.schema';

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

        const appointment = new this.appointmentModel({
            ...dto,
            clinicId: new Types.ObjectId(clinicId),
            doctorId: new Types.ObjectId(dto.doctorId),
            patientId: new Types.ObjectId(dto.patientId),
            date: new Date(dto.date),
        });
        return appointment.save();
    }

    async getAppointmentsByClinic(clinicId: string, filters?: { date?: string; status?: string; doctorId?: string }): Promise<AppointmentDocument[]> {
        const query: any = { clinicId: new Types.ObjectId(clinicId) };

        if (filters?.date) query.date = { $gte: new Date(filters.date), $lt: new Date(new Date(filters.date).getTime() + 86400000) };
        if (filters?.status) query.status = filters.status;
        if (filters?.doctorId) query.doctorId = new Types.ObjectId(filters.doctorId);

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
        const updateData: any = { ...dto };
        if (dto.date) updateData.date = new Date(dto.date);

        const appt = await this.appointmentModel.findByIdAndUpdate(appointmentId, updateData, { new: true }).exec();
        if (!appt) throw new NotFoundException('Rendez-vous non trouvé');
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

        const admission = new this.admissionModel({
            ...dto,
            clinicId: new Types.ObjectId(clinicId),
            patientId: new Types.ObjectId(dto.patientId),
            doctorId: dto.doctorId ? new Types.ObjectId(dto.doctorId) : undefined,
            date: new Date(),
            queueNumber: count + 1,
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
        const count = await this.invoiceModel.countDocuments({
            clinicId: new Types.ObjectId(clinicId),
        });
        const num = String(count + 1).padStart(4, '0');
        return `FAC-${year}-${num}`;
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
}
