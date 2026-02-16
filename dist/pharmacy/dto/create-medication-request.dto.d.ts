import { RequestStatus } from '../schemas/medication-request.schema';
export declare class CreateMedicationRequestDto {
    patientId: string;
    patientName: string;
    patientPhone?: string;
    medicationName: string;
    medicationDosage: string;
    quantity: number;
    unit?: string;
    isUrgent?: boolean;
}
export declare class UpdateMedicationRequestDto {
    status?: RequestStatus;
    isUrgent?: boolean;
}
