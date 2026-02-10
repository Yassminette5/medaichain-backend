import { Document, Types } from 'mongoose';
export type PatientProfileDocument = PatientProfile & Document;
export declare enum BloodType {
    A_POSITIVE = "A+",
    A_NEGATIVE = "A-",
    B_POSITIVE = "B+",
    B_NEGATIVE = "B-",
    AB_POSITIVE = "AB+",
    AB_NEGATIVE = "AB-",
    O_POSITIVE = "O+",
    O_NEGATIVE = "O-"
}
export declare enum Gender {
    MALE = "male",
    FEMALE = "female"
}
export declare class PatientProfile {
    userId: Types.ObjectId;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: Gender;
    nationalId: string;
    address: string;
    city: string;
    wilaya: string;
    bloodType: BloodType;
    allergies: string[];
    chronicDiseases: string[];
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelation: string;
    insuranceProvider: string;
    insuranceNumber: string;
    profilePhoto: string;
    height: number;
    weight: number;
}
export declare const PatientProfileSchema: import("mongoose").Schema<PatientProfile, import("mongoose").Model<PatientProfile, any, any, any, Document<unknown, any, PatientProfile, any, {}> & PatientProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PatientProfile, Document<unknown, {}, import("mongoose").FlatRecord<PatientProfile>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<PatientProfile> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
