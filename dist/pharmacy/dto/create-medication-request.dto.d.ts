import { RequestStatus } from '../schemas/medication-request.schema';
export declare class MedicationItemDto {
    medicationName: string;
    medicationDosage: string;
    quantity: number;
    unit?: string;
}
export declare class PatientLocationDto {
    latitude: number;
    longitude: number;
    address?: string;
}
export declare class CreateMedicationRequestDto {
    patientId: string;
    patientName: string;
    patientPhone?: string;
    patientLocation?: PatientLocationDto;
    medications: MedicationItemDto[];
    isUrgent?: boolean;
    requestsDelivery?: boolean;
    prescriptionImageUrl?: string;
}
export declare class UpdateMedicationRequestDto {
    status?: RequestStatus;
    isUrgent?: boolean;
}
