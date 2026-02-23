import { DoctorStatus } from '../schemas/clinic-doctor.schema';
export declare class AddDoctorToClinicDto {
    doctorId: string;
    fullName: string;
    speciality?: string;
    phone?: string;
    email?: string;
    workingDays?: string[];
    workingHoursStart?: string;
    workingHoursEnd?: string;
    consultationFee?: number;
}
export declare class UpdateClinicDoctorDto {
    speciality?: string;
    workingDays?: string[];
    workingHoursStart?: string;
    workingHoursEnd?: string;
    consultationFee?: number;
    status?: DoctorStatus;
}
