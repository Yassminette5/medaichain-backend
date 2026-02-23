import { AppointmentStatus } from '../schemas/appointment.schema';
export declare class CreateAppointmentDto {
    doctorId: string;
    patientId: string;
    date: string;
    timeSlot: string;
    reason?: string;
    patientName?: string;
    doctorName?: string;
}
export declare class UpdateAppointmentDto {
    status?: AppointmentStatus;
    notes?: string;
    diagnosis?: string;
    prescription?: string;
    date?: string;
    timeSlot?: string;
}
