import { Document, Types } from 'mongoose';
export type ClinicDocument = Clinic & Document;
export declare class Clinic {
    ownerId: Types.ObjectId;
    name: string;
    address: string;
    phoneNumber: string;
    email: string;
    city: string;
    wilaya: string;
    description: string;
    logo: string;
    isActive: boolean;
}
export declare const ClinicSchema: import("mongoose").Schema<Clinic, import("mongoose").Model<Clinic, any, any, any, Document<unknown, any, Clinic, any, {}> & Clinic & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Clinic, Document<unknown, {}, import("mongoose").FlatRecord<Clinic>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Clinic> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
