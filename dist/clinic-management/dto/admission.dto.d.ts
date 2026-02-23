import { AdmissionStatus } from '../schemas/admission.schema';
export declare class CreateAdmissionDto {
    patientId: string;
    patientName: string;
    patientPhone?: string;
    reason: string;
    doctorId?: string;
    notes?: string;
}
export declare class UpdateAdmissionDto {
    status?: AdmissionStatus;
    doctorId?: string;
    notes?: string;
    patientName?: string;
    patientPhone?: string;
    reason?: string;
}
