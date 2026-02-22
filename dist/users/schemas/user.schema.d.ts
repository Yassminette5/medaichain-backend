import { Document, Types } from 'mongoose';
export declare enum UserRole {
    PATIENT = "patient",
    MEDECIN = "medecin",
    PHARMACIE = "pharmacie",
    CENTRE_ANALYSE = "centre_analyse",
    CLINIQUE = "clinique"
}
export type UserDocument = User & Document;
export declare class User {
    email: string;
    password: string;
    phone: string;
    role: UserRole;
    isEmailVerified: boolean;
    isProfileCompleted: boolean;
    isActive: boolean;
    resetPasswordToken: string;
    resetPasswordExpires: Date;
    lastLoginAt: Date;
    patientInformation: Types.ObjectId;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<User> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
