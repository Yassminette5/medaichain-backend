import { Document, Types } from 'mongoose';
export type AdmissionDocument = Admission & Document;
export declare enum AdmissionStatus {
    WAITING = "waiting",
    IN_CONSULTATION = "in_consultation",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class Admission {
    clinicId: Types.ObjectId;
    patientId: Types.ObjectId;
    doctorId: Types.ObjectId;
    patientName: string;
    patientPhone: string;
    reason: string;
    date: Date;
    status: AdmissionStatus;
    queueNumber: number;
    notes: string;
}
export declare const AdmissionSchema: import("mongoose").Schema<Admission, import("mongoose").Model<Admission, any, any, any, Document<unknown, any, Admission, any, {}> & Admission & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Admission, Document<unknown, {}, import("mongoose").FlatRecord<Admission>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Admission> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
