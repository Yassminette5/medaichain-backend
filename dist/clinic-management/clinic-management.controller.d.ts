import { ClinicManagementService } from './clinic-management.service';
import { CreateClinicDto, UpdateClinicDto } from './dto/clinic.dto';
import { AddDoctorToClinicDto, UpdateClinicDoctorDto } from './dto/clinic-doctor.dto';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';
import { CreateAdmissionDto, UpdateAdmissionDto } from './dto/admission.dto';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from './dto/medical-record.dto';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
export declare class ClinicManagementController {
    private readonly service;
    constructor(service: ClinicManagementService);
    createClinic(req: any, dto: CreateClinicDto): Promise<import("./schemas/clinic.schema").ClinicDocument>;
    getMyClinic(req: any): Promise<import("./schemas/clinic.schema").ClinicDocument>;
    getClinicById(id: string): Promise<import("./schemas/clinic.schema").ClinicDocument>;
    updateClinic(id: string, dto: UpdateClinicDto): Promise<import("./schemas/clinic.schema").ClinicDocument>;
    deleteClinic(id: string): Promise<{
        message: string;
    }>;
    getAvailableDoctors(): Promise<import("../users/schemas/user.schema").UserDocument[]>;
    addDoctor(clinicId: string, dto: AddDoctorToClinicDto): Promise<import("./schemas/clinic-doctor.schema").ClinicDoctorDocument>;
    getDoctors(clinicId: string): Promise<import("./schemas/clinic-doctor.schema").ClinicDoctorDocument[]>;
    updateDoctor(id: string, dto: UpdateClinicDoctorDto): Promise<import("./schemas/clinic-doctor.schema").ClinicDoctorDocument>;
    removeDoctor(id: string): Promise<{
        message: string;
    }>;
    createAppointment(clinicId: string, dto: CreateAppointmentDto): Promise<import("./schemas/appointment.schema").AppointmentDocument>;
    getAppointments(clinicId: string, date?: string, status?: string, doctorId?: string): Promise<import("./schemas/appointment.schema").AppointmentDocument[]>;
    getAppointment(id: string): Promise<import("./schemas/appointment.schema").AppointmentDocument>;
    updateAppointment(id: string, dto: UpdateAppointmentDto): Promise<import("./schemas/appointment.schema").AppointmentDocument>;
    deleteAppointment(id: string): Promise<{
        message: string;
    }>;
    createAdmission(clinicId: string, dto: CreateAdmissionDto): Promise<import("./schemas/admission.schema").AdmissionDocument>;
    getAdmissions(clinicId: string, date?: string, status?: string): Promise<import("./schemas/admission.schema").AdmissionDocument[]>;
    updateAdmission(id: string, dto: UpdateAdmissionDto): Promise<import("./schemas/admission.schema").AdmissionDocument>;
    deleteAdmission(id: string): Promise<{
        message: string;
    }>;
    createMedicalRecord(clinicId: string, dto: CreateMedicalRecordDto): Promise<import("./schemas/medical-record.schema").MedicalRecordDocument>;
    getMedicalRecords(clinicId: string, patientId?: string, doctorId?: string, type?: string): Promise<import("./schemas/medical-record.schema").MedicalRecordDocument[]>;
    getMedicalRecord(id: string): Promise<import("./schemas/medical-record.schema").MedicalRecordDocument>;
    getPatientHistory(patientId: string): Promise<import("./schemas/medical-record.schema").MedicalRecordDocument[]>;
    updateMedicalRecord(id: string, dto: UpdateMedicalRecordDto): Promise<import("./schemas/medical-record.schema").MedicalRecordDocument>;
    deleteMedicalRecord(id: string): Promise<{
        message: string;
    }>;
    createInvoice(clinicId: string, dto: CreateInvoiceDto): Promise<import("./schemas/invoice.schema").InvoiceDocument>;
    getInvoices(clinicId: string, paymentStatus?: string, patientId?: string, startDate?: string, endDate?: string): Promise<import("./schemas/invoice.schema").InvoiceDocument[]>;
    getInvoice(id: string): Promise<import("./schemas/invoice.schema").InvoiceDocument>;
    updateInvoice(id: string, dto: UpdateInvoiceDto): Promise<import("./schemas/invoice.schema").InvoiceDocument>;
    deleteInvoice(id: string): Promise<{
        message: string;
    }>;
    getDashboard(clinicId: string): Promise<{
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
                id: import("mongoose").Types.ObjectId;
                patientName: string;
                doctorName: string;
                date: Date;
                timeSlot: string;
                status: import("./schemas/appointment.schema").AppointmentStatus;
            }[];
            invoices: {
                id: import("mongoose").Types.ObjectId;
                invoiceNumber: string;
                patientName: string;
                totalAmount: number;
                paymentStatus: import("./schemas/invoice.schema").PaymentStatus;
                date: Date;
            }[];
        };
    }>;
}
