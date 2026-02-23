import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PharmacyProfileDocument = PharmacyProfile & Document;

@Schema({ timestamps: true })
export class PharmacyProfile {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    pharmacyName: string;

    @Prop({ required: true })
    ownerName: string;

    @Prop({ required: true })
    licenseNumber: string; // Numéro d'agrément

    @Prop({ required: true })
    address: string;

    @Prop()
    city: string;

    @Prop()
    wilaya: string;

    @Prop()
    postalCode: string;

    @Prop()
    gpsLatitude: number;

    @Prop()
    gpsLongitude: number;

    @Prop([String])
    workingDays: string[];

    @Prop()
    openingTime: string; // 08:00

    @Prop()
    closingTime: string; // 20:00

    @Prop({ default: false })
    is24Hours: boolean;

    @Prop({ default: false })
    hasDelivery: boolean;

    @Prop()
    deliveryRadius: number; // en km

    @Prop({ default: 0 })
    deliveryFee: number; // Frais de livraison par défaut

    @Prop([String])
    services: string[]; // Services offerts

    @Prop()
    profilePhoto: string;

    @Prop({ default: false })
    isVerified: boolean;

    @Prop()
    verifiedAt: Date;

    // Notification preferences
    @Prop({ default: true })
    notificationsEnabled: boolean;

    @Prop({ default: true })
    emailNotifications: boolean;

    @Prop({ default: true })
    smsNotifications: boolean;

    @Prop({ default: true })
    deliveryNotifications: boolean;

    @Prop({ default: true })
    prescriptionNotifications: boolean;
}

export const PharmacyProfileSchema = SchemaFactory.createForClass(PharmacyProfile);
