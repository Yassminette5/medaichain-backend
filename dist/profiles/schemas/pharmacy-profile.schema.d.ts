import { Document, Types } from 'mongoose';
export type PharmacyProfileDocument = PharmacyProfile & Document;
export declare class PharmacyProfile {
    userId: Types.ObjectId;
    pharmacyName: string;
    ownerName: string;
    licenseNumber: string;
    address: string;
    city: string;
    wilaya: string;
    postalCode: string;
    gpsLatitude: number;
    gpsLongitude: number;
    workingDays: string[];
    openingTime: string;
    closingTime: string;
    is24Hours: boolean;
    hasDelivery: boolean;
    deliveryRadius: number;
    deliveryFee: number;
    services: string[];
    profilePhoto: string;
    isVerified: boolean;
    verifiedAt: Date;
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    deliveryNotifications: boolean;
    prescriptionNotifications: boolean;
}
export declare const PharmacyProfileSchema: import("mongoose").Schema<PharmacyProfile, import("mongoose").Model<PharmacyProfile, any, any, any, Document<unknown, any, PharmacyProfile, any, {}> & PharmacyProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PharmacyProfile, Document<unknown, {}, import("mongoose").FlatRecord<PharmacyProfile>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<PharmacyProfile> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
