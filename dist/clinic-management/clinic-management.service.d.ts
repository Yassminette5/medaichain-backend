import { Model, Types } from 'mongoose';
import { ClinicDocument } from './schemas/clinic.schema';
import { ClinicDoctorDocument } from './schemas/clinic-doctor.schema';
import { AppointmentDocument } from './schemas/appointment.schema';
import { AdmissionDocument } from './schemas/admission.schema';
import { MedicalRecordDocument } from './schemas/medical-record.schema';
import { InvoiceDocument } from './schemas/invoice.schema';
import { CreateClinicDto, UpdateClinicDto } from './dto/clinic.dto';
import { AddDoctorToClinicDto, UpdateClinicDoctorDto } from './dto/clinic-doctor.dto';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';
import { CreateAdmissionDto, UpdateAdmissionDto } from './dto/admission.dto';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from './dto/medical-record.dto';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { UserDocument } from '../users/schemas/user.schema';
export declare class ClinicManagementService {
    private clinicModel;
    private clinicDoctorModel;
    private appointmentModel;
    private admissionModel;
    private medicalRecordModel;
    private invoiceModel;
    private userModel;
    constructor(clinicModel: Model<ClinicDocument>, clinicDoctorModel: Model<ClinicDoctorDocument>, appointmentModel: Model<AppointmentDocument>, admissionModel: Model<AdmissionDocument>, medicalRecordModel: Model<MedicalRecordDocument>, invoiceModel: Model<InvoiceDocument>, userModel: Model<UserDocument>);
    createClinic(ownerId: string, dto: CreateClinicDto): Promise<ClinicDocument>;
    getClinicByOwner(ownerId: string): Promise<ClinicDocument>;
    getClinicById(clinicId: string): Promise<ClinicDocument>;
    updateClinic(clinicId: string, dto: UpdateClinicDto): Promise<ClinicDocument>;
    deleteClinic(clinicId: string): Promise<{
        message: string;
    }>;
    addDoctorToClinic(clinicId: string, dto: AddDoctorToClinicDto): Promise<ClinicDoctorDocument>;
    getDoctorsByClinic(clinicId: string): Promise<ClinicDoctorDocument[]>;
    updateClinicDoctor(clinicDoctorId: string, dto: UpdateClinicDoctorDto): Promise<ClinicDoctorDocument>;
    removeDoctorFromClinic(clinicDoctorId: string): Promise<{
        message: string;
    }>;
    getAvailableDoctors(): Promise<UserDocument[]>;
    createAppointment(clinicId: string, dto: CreateAppointmentDto): Promise<AppointmentDocument>;
    getAppointmentsByClinic(clinicId: string, filters?: {
        date?: string;
        status?: string;
        doctorId?: string;
    }): Promise<AppointmentDocument[]>;
    getAppointmentById(appointmentId: string): Promise<AppointmentDocument>;
    updateAppointment(appointmentId: string, dto: UpdateAppointmentDto): Promise<AppointmentDocument>;
    deleteAppointment(appointmentId: string): Promise<{
        message: string;
    }>;
    createAdmission(clinicId: string, dto: CreateAdmissionDto): Promise<AdmissionDocument>;
    getAdmissionsByClinic(clinicId: string, filters?: {
        date?: string;
        status?: string;
    }): Promise<AdmissionDocument[]>;
    updateAdmission(admissionId: string, dto: UpdateAdmissionDto): Promise<AdmissionDocument>;
    deleteAdmission(admissionId: string): Promise<{
        message: string;
    }>;
    createMedicalRecord(clinicId: string, dto: CreateMedicalRecordDto): Promise<MedicalRecordDocument>;
    getMedicalRecordsByClinic(clinicId: string, filters?: {
        patientId?: string;
        doctorId?: string;
        type?: string;
    }): Promise<MedicalRecordDocument[]>;
    getMedicalRecordById(recordId: string): Promise<MedicalRecordDocument>;
    getPatientMedicalHistory(patientId: string): Promise<MedicalRecordDocument[]>;
    updateMedicalRecord(recordId: string, dto: UpdateMedicalRecordDto): Promise<MedicalRecordDocument>;
    deleteMedicalRecord(recordId: string): Promise<{
        message: string;
    }>;
    private generateInvoiceNumber;
    createInvoice(clinicId: string, dto: CreateInvoiceDto): Promise<InvoiceDocument>;
    getInvoicesByClinic(clinicId: string, filters?: {
        paymentStatus?: string;
        patientId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<InvoiceDocument[]>;
    getInvoiceById(invoiceId: string): Promise<InvoiceDocument>;
    updateInvoice(invoiceId: string, dto: UpdateInvoiceDto): Promise<InvoiceDocument>;
    deleteInvoice(invoiceId: string): Promise<{
        message: string;
    }>;
    getDashboardStats(clinicId: string): Promise<{
        overview: {
            totalDoctors: number;
            activeDoctors: number;
            totalAppointmentsToday: number;
            totalAdmissionsToday: number;
            pendingAppointments: number;
            totalMedicalRecords: number;
        };
        admissionsToday: {
            total: number;
            waiting: number;
            inConsultation: number;
            completed: number;
        };
        monthly: {
            appointments: {
                total: number;
                completed: number;
                cancelled: number;
                noShow: number;
                completionRate: number;
                cancellationRate: number;
                noShowRate: number;
                trend: number;
                trendLabel: string;
            };
            medicalRecords: number;
        };
        finance: {
            totalRevenue: any;
            totalPaid: any;
            totalDue: any;
            invoicesCount: number;
            paidInvoices: number;
            pendingInvoices: number;
            trend: number;
            trendLabel: string;
            revenueByDay: {
                date: string;
                revenue: any;
                paid: any;
                invoices: any;
            }[];
        };
        analytics: {
            topDoctors: {
                doctorId: any;
                doctorName: any;
                consultations: any;
            }[];
            appointmentsByDay: {
                day: string;
                count: any;
            }[];
            recordsByType: {
                type: any;
                count: any;
            }[];
        };
        recentActivity: {
            appointments: {
                id: Types.ObjectId;
                patientName: string;
                doctorName: string;
                date: Date;
                timeSlot: string;
                status: import("./schemas/appointment.schema").AppointmentStatus;
            }[];
            invoices: {
                id: Types.ObjectId;
                invoiceNumber: string;
                patientName: string;
                totalAmount: number;
                paymentStatus: import("./schemas/invoice.schema").PaymentStatus;
                date: Date;
            }[];
        };
    }>;
}
