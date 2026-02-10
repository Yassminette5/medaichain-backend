import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientProfileDocument = PatientProfile & Document;

export enum BloodType {
    A_POSITIVE = 'A+',
    A_NEGATIVE = 'A-',
    B_POSITIVE = 'B+',
    B_NEGATIVE = 'B-',
    AB_POSITIVE = 'AB+',
    AB_NEGATIVE = 'AB-',
    O_POSITIVE = 'O+',
    O_NEGATIVE = 'O-',
}

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
}

@Schema({ timestamps: true })
export class PatientProfile {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop({ required: true })
    dateOfBirth: Date;

    @Prop({ enum: Gender })
    gender: Gender;

    @Prop()
    nationalId: string; // Numéro de carte d'identité

    @Prop()
    address: string;

    @Prop()
    city: string;

    @Prop()
    wilaya: string;

    @Prop({ enum: BloodType })
    bloodType: BloodType;

    @Prop([String])
    allergies: string[];

    @Prop([String])
    chronicDiseases: string[]; // Maladies chroniques

    @Prop()
    emergencyContactName: string;

    @Prop()
    emergencyContactPhone: string;

    @Prop()
    emergencyContactRelation: string;

    @Prop()
    insuranceProvider: string; // CNAS, CASNOS, etc.

    @Prop()
    insuranceNumber: string;

    @Prop()
    profilePhoto: string;

    @Prop()
    height: number; // en cm

    @Prop()
    weight: number; // en kg
}

export const PatientProfileSchema = SchemaFactory.createForClass(PatientProfile);
