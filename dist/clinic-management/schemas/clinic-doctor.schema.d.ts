import { Document, Types } from 'mongoose';
export type ClinicDoctorDocument = ClinicDoctor & Document;
export declare enum DoctorStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    PENDING = "pending"
}
export declare class ClinicDoctor {
    clinicId: Types.ObjectId;
    doctorId: Types.ObjectId;
    fullName: string;
    speciality: string;
    phone: string;
    email: string;
    workingDays: string[];
    workingHoursStart: string;
    workingHoursEnd: string;
    consultationFee: number;
    status: DoctorStatus;
}
export declare const ClinicDoctorSchema: import("mongoose").Schema<ClinicDoctor, import("mongoose").Model<ClinicDoctor, any, any, any, Document<unknown, any, ClinicDoctor, any, {}> & ClinicDoctor & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ClinicDoctor, Document<unknown, {}, import("mongoose").FlatRecord<ClinicDoctor>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ClinicDoctor> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
