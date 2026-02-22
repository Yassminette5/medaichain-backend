import { Document, Types } from 'mongoose';
export type PatientInformationDocument = PatientInformation & Document;
export declare enum Gender {
    MALE = "male",
    FEMALE = "female"
}
export declare class PatientInformation {
    userId: Types.ObjectId;
    fullName: string;
    age: number;
    gender: Gender;
    allergies: string[];
    height: number;
    weight: number;
}
export declare const PatientInformationSchema: import("mongoose").Schema<PatientInformation, import("mongoose").Model<PatientInformation, any, any, any, Document<unknown, any, PatientInformation, any, {}> & PatientInformation & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PatientInformation, Document<unknown, {}, import("mongoose").FlatRecord<PatientInformation>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<PatientInformation> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
