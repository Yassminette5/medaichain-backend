import { Document } from 'mongoose';
export declare enum UserRole {
    PATIENT = "patient",
    MEDECIN = "medecin",
    PHARMACIE = "pharmacie",
    CENTRE_ANALYSE = "centre_analyse",
    CLINIQUE = "clinique",
    ADMIN = "admin"
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
    fullName?: string;
    gender?: string;
    age?: number;
    height?: number;
    weight?: number;
    allergies?: string[];
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<User> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
