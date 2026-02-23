import { Document, Types } from 'mongoose';
export type LabProfileDocument = LabProfile & Document;
export declare class LabProfile {
    userId: Types.ObjectId;
    centreName: string;
    categorie: string;
    phone: string;
    email: string;
    localisation: string;
    profilePhoto: string;
    isVerified: boolean;
    verifiedAt: Date;
}
export declare const LabProfileSchema: import("mongoose").Schema<LabProfile, import("mongoose").Model<LabProfile, any, any, any, Document<unknown, any, LabProfile, any, {}> & LabProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LabProfile, Document<unknown, {}, import("mongoose").FlatRecord<LabProfile>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<LabProfile> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
