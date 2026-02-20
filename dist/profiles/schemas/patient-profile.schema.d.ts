import { Document, Types } from 'mongoose';
export type PatientProfileDocument = PatientProfile & Document;
export declare enum Gender {
    MALE = "male",
    FEMALE = "female"
}
export declare class PatientProfile {
    userId: Types.ObjectId;
    fullName: string;
    age: number;
    gender: Gender;
    allergies: string[];
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
