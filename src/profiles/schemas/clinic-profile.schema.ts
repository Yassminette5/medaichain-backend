import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClinicProfileDocument = ClinicProfile & Document;

@Schema({ timestamps: true })
export class ClinicProfile {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    clinicName: string;

    @Prop()
    directorName: string;

    @Prop()
    licenseNumber: string; // Numéro d'agrément

    @Prop()
    officialEmail: string;

    @Prop()
    phone: string;

    @Prop()
    registrationNumber: string;

    @Prop()
    creationDate: Date;

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
    specialities: string[]; // Spécialités offertes

    @Prop([String])
    services: string[]; // Urgences, Chirurgie, Radiologie, etc.

    @Prop()
    bedCount: number; // Nombre de lits

    @Prop({ default: false })
    hasEmergency: boolean; // Service d'urgence 24/7

    @Prop({ default: false })
    hasAmbulance: boolean;

    @Prop([String])
    insuranceAccepted: string[]; // CNAS, CASNOS, privées

    @Prop([String])
    workingDays: string[];

    @Prop()
    openingTime: string;

    @Prop()
    closingTime: string;

    @Prop()
    website: string;

    @Prop()
    profilePhoto: string;

    @Prop([String])
    photos: string[]; // Photos de la clinique

    @Prop({ default: false })
    isVerified: boolean;

    @Prop()
    verifiedAt: Date;
}

export const ClinicProfileSchema = SchemaFactory.createForClass(ClinicProfile);
