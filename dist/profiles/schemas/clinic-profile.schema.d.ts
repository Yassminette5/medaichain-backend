import { Document, Types } from 'mongoose';
export type ClinicProfileDocument = ClinicProfile & Document;
export declare class ClinicProfile {
    userId: Types.ObjectId;
    clinicName: string;
    directorName: string;
    licenseNumber: string;
    registrationNumber: string;
    address: string;
    city: string;
    wilaya: string;
    postalCode: string;
    gpsLatitude: number;
    gpsLongitude: number;
    specialities: string[];
    services: string[];
    bedCount: number;
    hasEmergency: boolean;
    hasAmbulance: boolean;
    insuranceAccepted: string[];
    workingDays: string[];
    openingTime: string;
    closingTime: string;
    website: string;
    profilePhoto: string;
    photos: string[];
    isVerified: boolean;
    verifiedAt: Date;
}
export declare const ClinicProfileSchema: import("mongoose").Schema<ClinicProfile, import("mongoose").Model<ClinicProfile, any, any, any, Document<unknown, any, ClinicProfile, any, {}> & ClinicProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ClinicProfile, Document<unknown, {}, import("mongoose").FlatRecord<ClinicProfile>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ClinicProfile> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
