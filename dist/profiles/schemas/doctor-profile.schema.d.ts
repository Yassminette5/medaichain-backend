import { Document, Types } from 'mongoose';
export type DoctorProfileDocument = DoctorProfile & Document;
export declare class DoctorProfile {
    userId: Types.ObjectId;
    fullName: string;
    speciality: string;
    subSpeciality: string;
    licenseNumber: string;
    hospital: string;
    clinicAddress: string;
    city: string;
    wilaya: string;
    yearsOfExperience: number;
    consultationFee: number;
    languages: string[];
    workingDays: string[];
    workingHoursStart: string;
    workingHoursEnd: string;
    bio: string;
    profilePhoto: string;
    isVerified: boolean;
    verifiedAt: Date;
}
export declare const DoctorProfileSchema: import("mongoose").Schema<DoctorProfile, import("mongoose").Model<DoctorProfile, any, any, any, Document<unknown, any, DoctorProfile, any, {}> & DoctorProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, DoctorProfile, Document<unknown, {}, import("mongoose").FlatRecord<DoctorProfile>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<DoctorProfile> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
