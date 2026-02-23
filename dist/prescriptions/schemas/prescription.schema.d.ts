import { Document, Types } from 'mongoose';
declare class Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
}
export declare class Prescription extends Document {
    patientId: Types.ObjectId;
    doctorId: Types.ObjectId;
    medications: Medication[];
    diagnosis?: string;
    notes?: string;
    status: string;
    prescriptionDate: Date;
}
export declare const PrescriptionSchema: import("mongoose").Schema<Prescription, import("mongoose").Model<Prescription, any, any, any, Document<unknown, any, Prescription, any, {}> & Prescription & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Prescription, Document<unknown, {}, import("mongoose").FlatRecord<Prescription>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Prescription> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
export {};
