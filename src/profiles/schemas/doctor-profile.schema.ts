import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DoctorProfileDocument = DoctorProfile & Document;

@Schema({ timestamps: true })
export class DoctorProfile {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    fullName: string;

    @Prop()
    speciality: string; // Cardiologie, Pédiatrie, etc.

    @Prop()
    subSpeciality: string;

    @Prop()
    licenseNumber: string; // Numéro d'ordre des médecins

    @Prop()
    hospital: string; // Hôpital/Clinique d'exercice

    @Prop()
    clinicAddress: string;

    @Prop()
    city: string;

    @Prop()
    wilaya: string;

    @Prop()
    yearsOfExperience: number;

    @Prop()
    consultationFee: number;

    @Prop([String])
    languages: string[]; // Langues parlées

    @Prop([String])
    workingDays: string[]; // Jours de travail

    @Prop()
    workingHoursStart: string; // 08:00

    @Prop()
    workingHoursEnd: string; // 17:00

    @Prop()
    bio: string;

    @Prop()
    profilePhoto: string;

    @Prop({ default: false })
    isVerified: boolean; // Vérifié par l'admin

    @Prop()
    verifiedAt: Date;
}

export const DoctorProfileSchema = SchemaFactory.createForClass(DoctorProfile);
