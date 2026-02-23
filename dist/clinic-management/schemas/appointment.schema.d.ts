import { Document, Types } from 'mongoose';
export type AppointmentDocument = Appointment & Document;
export declare enum AppointmentStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_SHOW = "no_show"
}
export declare class Appointment {
    clinicId: Types.ObjectId;
    doctorId: Types.ObjectId;
    patientId: Types.ObjectId;
    date: Date;
    timeSlot: string;
    status: AppointmentStatus;
    reason: string;
    notes: string;
    diagnosis: string;
    prescription: string;
    patientName: string;
    doctorName: string;
}
export declare const AppointmentSchema: import("mongoose").Schema<Appointment, import("mongoose").Model<Appointment, any, any, any, Document<unknown, any, Appointment, any, {}> & Appointment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Appointment, Document<unknown, {}, import("mongoose").FlatRecord<Appointment>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Appointment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
