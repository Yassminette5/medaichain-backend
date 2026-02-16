import { Document } from 'mongoose';
export declare enum RequestStatus {
    TOUT = "tout",
    URGENT = "urgent",
    EN_ATTENTE = "enAttente",
    VALIDE = "valide",
    NON_VALIDE = "nonValide",
    TERMINE = "termine"
}
export declare class Patient {
    id: string;
    name: string;
    phoneNumber?: string;
}
export declare class RequestedMedication {
    id: string;
    name: string;
    dosage: string;
    quantity: number;
    unit: string;
    isValidated?: boolean;
    validationNote?: string;
}
export declare class MedicationRequest extends Document {
    pharmacyId: string;
    patient: Patient;
    medication: RequestedMedication;
    status: RequestStatus;
    requestDate: Date;
    isUrgent: boolean;
    prescriptionImageUrl?: string;
    doctorName?: string;
    validationNote?: string;
    deliveryConfirmedAt?: Date;
}
export declare const MedicationRequestSchema: import("mongoose").Schema<MedicationRequest, import("mongoose").Model<MedicationRequest, any, any, any, Document<unknown, any, MedicationRequest, any, {}> & MedicationRequest & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MedicationRequest, Document<unknown, {}, import("mongoose").FlatRecord<MedicationRequest>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<MedicationRequest> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
