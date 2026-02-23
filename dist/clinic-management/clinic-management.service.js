"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicManagementService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const clinic_schema_1 = require("./schemas/clinic.schema");
const clinic_doctor_schema_1 = require("./schemas/clinic-doctor.schema");
const appointment_schema_1 = require("./schemas/appointment.schema");
const admission_schema_1 = require("./schemas/admission.schema");
const medical_record_schema_1 = require("./schemas/medical-record.schema");
const invoice_schema_1 = require("./schemas/invoice.schema");
const user_schema_1 = require("../users/schemas/user.schema");
let ClinicManagementService = class ClinicManagementService {
    clinicModel;
    clinicDoctorModel;
    appointmentModel;
    admissionModel;
    medicalRecordModel;
    invoiceModel;
    userModel;
    constructor(clinicModel, clinicDoctorModel, appointmentModel, admissionModel, medicalRecordModel, invoiceModel, userModel) {
        this.clinicModel = clinicModel;
        this.clinicDoctorModel = clinicDoctorModel;
        this.appointmentModel = appointmentModel;
        this.admissionModel = admissionModel;
        this.medicalRecordModel = medicalRecordModel;
        this.invoiceModel = invoiceModel;
        this.userModel = userModel;
    }
    async createClinic(ownerId, dto) {
        const clinic = new this.clinicModel({
            ...dto,
            ownerId: new mongoose_2.Types.ObjectId(ownerId),
        });
        return clinic.save();
    }
    async getClinicByOwner(ownerId) {
        const clinic = await this.clinicModel.findOne({ ownerId: new mongoose_2.Types.ObjectId(ownerId) }).exec();
        if (!clinic)
            throw new common_1.NotFoundException('Clinique non trouvée');
        return clinic;
    }
    async getClinicById(clinicId) {
        const clinic = await this.clinicModel.findById(clinicId).exec();
        if (!clinic)
            throw new common_1.NotFoundException('Clinique non trouvée');
        return clinic;
    }
    async updateClinic(clinicId, dto) {
        const clinic = await this.clinicModel.findByIdAndUpdate(clinicId, dto, { new: true }).exec();
        if (!clinic)
            throw new common_1.NotFoundException('Clinique non trouvée');
        return clinic;
    }
    async deleteClinic(clinicId) {
        await this.clinicModel.findByIdAndDelete(clinicId).exec();
        return { message: 'Clinique supprimée avec succès' };
    }
    async addDoctorToClinic(clinicId, dto) {
        await this.getClinicById(clinicId);
        const existing = await this.clinicDoctorModel.findOne({
            clinicId: new mongoose_2.Types.ObjectId(clinicId),
            doctorId: new mongoose_2.Types.ObjectId(dto.doctorId),
        }).exec();
        if (existing) {
            throw new common_1.BadRequestException('Ce médecin est déjà associé à cette clinique');
        }
        const clinicDoctor = new this.clinicDoctorModel({
            ...dto,
            clinicId: new mongoose_2.Types.ObjectId(clinicId),
            doctorId: new mongoose_2.Types.ObjectId(dto.doctorId),
        });
        return clinicDoctor.save();
    }
    async getDoctorsByClinic(clinicId) {
        return this.clinicDoctorModel
            .find({ clinicId: new mongoose_2.Types.ObjectId(clinicId) })
            .populate('doctorId', 'email phone role')
            .exec();
    }
    async updateClinicDoctor(clinicDoctorId, dto) {
        const doc = await this.clinicDoctorModel.findByIdAndUpdate(clinicDoctorId, dto, { new: true }).exec();
        if (!doc)
            throw new common_1.NotFoundException('Médecin non trouvé dans cette clinique');
        return doc;
    }
    async removeDoctorFromClinic(clinicDoctorId) {
        await this.clinicDoctorModel.findByIdAndDelete(clinicDoctorId).exec();
        return { message: 'Médecin retiré de la clinique' };
    }
    async getAvailableDoctors() {
        return this.userModel.find({ role: 'medecin' }).select('_id email phone role').exec();
    }
    async createAppointment(clinicId, dto) {
        await this.getClinicById(clinicId);
        const appointment = new this.appointmentModel({
            ...dto,
            clinicId: new mongoose_2.Types.ObjectId(clinicId),
            doctorId: new mongoose_2.Types.ObjectId(dto.doctorId),
            patientId: new mongoose_2.Types.ObjectId(dto.patientId),
            date: new Date(dto.date),
        });
        return appointment.save();
    }
    async getAppointmentsByClinic(clinicId, filters) {
        const query = { clinicId: new mongoose_2.Types.ObjectId(clinicId) };
        if (filters?.date)
            query.date = { $gte: new Date(filters.date), $lt: new Date(new Date(filters.date).getTime() + 86400000) };
        if (filters?.status)
            query.status = filters.status;
        if (filters?.doctorId)
            query.doctorId = new mongoose_2.Types.ObjectId(filters.doctorId);
        return this.appointmentModel
            .find(query)
            .populate('doctorId', 'email phone')
            .populate('patientId', 'email phone')
            .sort({ date: 1, timeSlot: 1 })
            .exec();
    }
    async getAppointmentById(appointmentId) {
        const appt = await this.appointmentModel
            .findById(appointmentId)
            .populate('doctorId', 'email phone')
            .populate('patientId', 'email phone')
            .exec();
        if (!appt)
            throw new common_1.NotFoundException('Rendez-vous non trouvé');
        return appt;
    }
    async updateAppointment(appointmentId, dto) {
        const updateData = { ...dto };
        if (dto.date)
            updateData.date = new Date(dto.date);
        const appt = await this.appointmentModel.findByIdAndUpdate(appointmentId, updateData, { new: true }).exec();
        if (!appt)
            throw new common_1.NotFoundException('Rendez-vous non trouvé');
        return appt;
    }
    async deleteAppointment(appointmentId) {
        await this.appointmentModel.findByIdAndDelete(appointmentId).exec();
        return { message: 'Rendez-vous supprimé' };
    }
    async createAdmission(clinicId, dto) {
        await this.getClinicById(clinicId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        const count = await this.admissionModel.countDocuments({
            clinicId: new mongoose_2.Types.ObjectId(clinicId),
            date: { $gte: today, $lte: todayEnd },
        });
        const admission = new this.admissionModel({
            ...dto,
            clinicId: new mongoose_2.Types.ObjectId(clinicId),
            patientId: new mongoose_2.Types.ObjectId(dto.patientId),
            doctorId: dto.doctorId ? new mongoose_2.Types.ObjectId(dto.doctorId) : undefined,
            date: new Date(),
            queueNumber: count + 1,
        });
        return admission.save();
    }
    async getAdmissionsByClinic(clinicId, filters) {
        const query = { clinicId: new mongoose_2.Types.ObjectId(clinicId) };
        if (filters?.date) {
            const d = new Date(filters.date);
            d.setHours(0, 0, 0, 0);
            const dEnd = new Date(d);
            dEnd.setHours(23, 59, 59, 999);
            query.date = { $gte: d, $lte: dEnd };
        }
        if (filters?.status)
            query.status = filters.status;
        return this.admissionModel
            .find(query)
            .populate('patientId', 'email phone')
            .populate('doctorId', 'email phone')
            .sort({ queueNumber: 1 })
            .exec();
    }
    async updateAdmission(admissionId, dto) {
        const updateData = { ...dto };
        if (dto.doctorId)
            updateData.doctorId = new mongoose_2.Types.ObjectId(dto.doctorId);
        const adm = await this.admissionModel.findByIdAndUpdate(admissionId, updateData, { new: true }).exec();
        if (!adm)
            throw new common_1.NotFoundException('Admission non trouvée');
        return adm;
    }
    async deleteAdmission(admissionId) {
        const adm = await this.admissionModel.findByIdAndDelete(admissionId).exec();
        if (!adm)
            throw new common_1.NotFoundException('Admission non trouvée');
        return { message: 'Admission supprimée avec succès' };
    }
    async createMedicalRecord(clinicId, dto) {
        await this.getClinicById(clinicId);
        const record = new this.medicalRecordModel({
            ...dto,
            clinicId: new mongoose_2.Types.ObjectId(clinicId),
            patientId: new mongoose_2.Types.ObjectId(dto.patientId),
            doctorId: new mongoose_2.Types.ObjectId(dto.doctorId),
            appointmentId: dto.appointmentId ? new mongoose_2.Types.ObjectId(dto.appointmentId) : undefined,
            date: new Date(),
        });
        return record.save();
    }
    async getMedicalRecordsByClinic(clinicId, filters) {
        const query = { clinicId: new mongoose_2.Types.ObjectId(clinicId) };
        if (filters?.patientId)
            query.patientId = new mongoose_2.Types.ObjectId(filters.patientId);
        if (filters?.doctorId)
            query.doctorId = new mongoose_2.Types.ObjectId(filters.doctorId);
        if (filters?.type)
            query.type = filters.type;
        return this.medicalRecordModel
            .find(query)
            .populate('patientId', 'email phone')
            .populate('doctorId', 'email phone')
            .sort({ date: -1 })
            .exec();
    }
    async getMedicalRecordById(recordId) {
        const record = await this.medicalRecordModel
            .findById(recordId)
            .populate('patientId', 'email phone')
            .populate('doctorId', 'email phone')
            .exec();
        if (!record)
            throw new common_1.NotFoundException('Dossier médical non trouvé');
        return record;
    }
    async getPatientMedicalHistory(patientId) {
        return this.medicalRecordModel
            .find({ patientId: new mongoose_2.Types.ObjectId(patientId) })
            .populate('clinicId', 'name address')
            .populate('doctorId', 'email phone')
            .sort({ date: -1 })
            .exec();
    }
    async updateMedicalRecord(recordId, dto) {
        const record = await this.medicalRecordModel.findByIdAndUpdate(recordId, dto, { new: true }).exec();
        if (!record)
            throw new common_1.NotFoundException('Dossier médical non trouvé');
        return record;
    }
    async deleteMedicalRecord(recordId) {
        const record = await this.medicalRecordModel.findByIdAndDelete(recordId).exec();
        if (!record)
            throw new common_1.NotFoundException('Dossier médical non trouvé');
        return { message: 'Dossier médical supprimé avec succès' };
    }
    async generateInvoiceNumber(clinicId) {
        const year = new Date().getFullYear();
        const count = await this.invoiceModel.countDocuments({
            clinicId: new mongoose_2.Types.ObjectId(clinicId),
        });
        const num = String(count + 1).padStart(4, '0');
        return `FAC-${year}-${num}`;
    }
    async createInvoice(clinicId, dto) {
        await this.getClinicById(clinicId);
        const items = dto.items.map(item => ({
            ...item,
            quantity: item.quantity || 1,
            total: (item.quantity || 1) * item.unitPrice,
        }));
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        let totalAmount = subtotal;
        if (dto.discountPercentage) {
            totalAmount -= (subtotal * dto.discountPercentage / 100);
        }
        else if (dto.discount) {
            totalAmount -= dto.discount;
        }
        if (dto.tax) {
            totalAmount += (totalAmount * dto.tax / 100);
        }
        const invoiceNumber = await this.generateInvoiceNumber(clinicId);
        const invoice = new this.invoiceModel({
            invoiceNumber,
            clinicId: new mongoose_2.Types.ObjectId(clinicId),
            patientId: new mongoose_2.Types.ObjectId(dto.patientId),
            doctorId: dto.doctorId ? new mongoose_2.Types.ObjectId(dto.doctorId) : undefined,
            appointmentId: dto.appointmentId ? new mongoose_2.Types.ObjectId(dto.appointmentId) : undefined,
            medicalRecordId: dto.medicalRecordId ? new mongoose_2.Types.ObjectId(dto.medicalRecordId) : undefined,
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
    async getInvoicesByClinic(clinicId, filters) {
        const query = { clinicId: new mongoose_2.Types.ObjectId(clinicId) };
        if (filters?.paymentStatus)
            query.paymentStatus = filters.paymentStatus;
        if (filters?.patientId)
            query.patientId = new mongoose_2.Types.ObjectId(filters.patientId);
        if (filters?.startDate || filters?.endDate) {
            query.date = {};
            if (filters.startDate)
                query.date.$gte = new Date(filters.startDate);
            if (filters.endDate)
                query.date.$lte = new Date(filters.endDate);
        }
        return this.invoiceModel
            .find(query)
            .populate('patientId', 'email phone')
            .populate('doctorId', 'email phone')
            .sort({ date: -1 })
            .exec();
    }
    async getInvoiceById(invoiceId) {
        const invoice = await this.invoiceModel
            .findById(invoiceId)
            .populate('patientId', 'email phone')
            .populate('doctorId', 'email phone')
            .exec();
        if (!invoice)
            throw new common_1.NotFoundException('Facture non trouvée');
        return invoice;
    }
    async updateInvoice(invoiceId, dto) {
        const invoice = await this.invoiceModel.findById(invoiceId).exec();
        if (!invoice)
            throw new common_1.NotFoundException('Facture non trouvée');
        if (dto.amountPaid !== undefined) {
            const newAmountPaid = dto.amountPaid;
            const amountDue = invoice.totalAmount - newAmountPaid;
            let paymentStatus = 'pending';
            if (newAmountPaid >= invoice.totalAmount) {
                paymentStatus = 'paid';
            }
            else if (newAmountPaid > 0) {
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
        if (!updated)
            throw new common_1.NotFoundException('Facture non trouvée');
        return updated;
    }
    async deleteInvoice(invoiceId) {
        const invoice = await this.invoiceModel.findByIdAndDelete(invoiceId).exec();
        if (!invoice)
            throw new common_1.NotFoundException('Facture non trouvée');
        return { message: 'Facture supprimée avec succès' };
    }
    async getDashboardStats(clinicId) {
        const objectId = new mongoose_2.Types.ObjectId(clinicId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        const weekStart = new Date(today);
        const dayOfWeek = today.getDay() || 7;
        weekStart.setDate(today.getDate() - dayOfWeek + 1);
        weekStart.setHours(0, 0, 0, 0);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        const [totalDoctors, activeDoctors, totalAppointmentsToday, totalAdmissionsToday, pendingAppointments, totalAppointmentsMonth, totalAppointmentsLastMonth, completedAppointmentsMonth, cancelledAppointmentsMonth, noShowAppointmentsMonth, totalMedicalRecords, totalMedicalRecordsMonth, totalInvoicesMonth, paidInvoicesMonth, pendingInvoicesMonth, waitingAdmissions, inConsultationAdmissions, completedAdmissionsToday,] = await Promise.all([
            this.clinicDoctorModel.countDocuments({ clinicId: objectId }),
            this.clinicDoctorModel.countDocuments({ clinicId: objectId, status: 'active' }),
            this.appointmentModel.countDocuments({ clinicId: objectId, date: { $gte: today, $lte: todayEnd } }),
            this.admissionModel.countDocuments({ clinicId: objectId, date: { $gte: today, $lte: todayEnd } }),
            this.appointmentModel.countDocuments({ clinicId: objectId, status: 'pending' }),
            this.appointmentModel.countDocuments({ clinicId: objectId, date: { $gte: monthStart, $lte: monthEnd } }),
            this.appointmentModel.countDocuments({ clinicId: objectId, date: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
            this.appointmentModel.countDocuments({ clinicId: objectId, status: 'completed', date: { $gte: monthStart, $lte: monthEnd } }),
            this.appointmentModel.countDocuments({ clinicId: objectId, status: 'cancelled', date: { $gte: monthStart, $lte: monthEnd } }),
            this.appointmentModel.countDocuments({ clinicId: objectId, status: 'no_show', date: { $gte: monthStart, $lte: monthEnd } }),
            this.medicalRecordModel.countDocuments({ clinicId: objectId }),
            this.medicalRecordModel.countDocuments({ clinicId: objectId, date: { $gte: monthStart, $lte: monthEnd } }),
            this.invoiceModel.countDocuments({ clinicId: objectId, date: { $gte: monthStart, $lte: monthEnd } }),
            this.invoiceModel.countDocuments({ clinicId: objectId, paymentStatus: 'paid', date: { $gte: monthStart, $lte: monthEnd } }),
            this.invoiceModel.countDocuments({ clinicId: objectId, paymentStatus: 'pending', date: { $gte: monthStart, $lte: monthEnd } }),
            this.admissionModel.countDocuments({ clinicId: objectId, status: 'waiting', date: { $gte: today, $lte: todayEnd } }),
            this.admissionModel.countDocuments({ clinicId: objectId, status: 'in_consultation', date: { $gte: today, $lte: todayEnd } }),
            this.admissionModel.countDocuments({ clinicId: objectId, status: 'completed', date: { $gte: today, $lte: todayEnd } }),
        ]);
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
        const recentAppointments = await this.appointmentModel
            .find({ clinicId: objectId })
            .sort({ createdAt: -1 })
            .limit(5)
            .exec();
        const recentInvoices = await this.invoiceModel
            .find({ clinicId: objectId })
            .sort({ createdAt: -1 })
            .limit(5)
            .exec();
        const revenue = revenueAgg[0] || { totalRevenue: 0, totalPaid: 0, totalDue: 0 };
        const lastMonthRevenue = lastMonthRevenueAgg[0]?.totalRevenue || 0;
        const appointmentsTrend = totalAppointmentsLastMonth > 0
            ? Math.round(((totalAppointmentsMonth - totalAppointmentsLastMonth) / totalAppointmentsLastMonth) * 100)
            : 0;
        const revenueTrend = lastMonthRevenue > 0
            ? Math.round(((revenue.totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
            : 0;
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
            overview: {
                totalDoctors,
                activeDoctors,
                totalAppointmentsToday,
                totalAdmissionsToday,
                pendingAppointments,
                totalMedicalRecords,
            },
            admissionsToday: {
                total: totalAdmissionsToday,
                waiting: waitingAdmissions,
                inConsultation: inConsultationAdmissions,
                completed: completedAdmissionsToday,
            },
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
};
exports.ClinicManagementService = ClinicManagementService;
exports.ClinicManagementService = ClinicManagementService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(clinic_schema_1.Clinic.name)),
    __param(1, (0, mongoose_1.InjectModel)(clinic_doctor_schema_1.ClinicDoctor.name)),
    __param(2, (0, mongoose_1.InjectModel)(appointment_schema_1.Appointment.name)),
    __param(3, (0, mongoose_1.InjectModel)(admission_schema_1.Admission.name)),
    __param(4, (0, mongoose_1.InjectModel)(medical_record_schema_1.MedicalRecord.name)),
    __param(5, (0, mongoose_1.InjectModel)(invoice_schema_1.Invoice.name)),
    __param(6, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ClinicManagementService);
//# sourceMappingURL=clinic-management.service.js.map