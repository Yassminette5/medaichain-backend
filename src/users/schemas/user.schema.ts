import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
    PATIENT = 'patient',
    MEDECIN = 'medecin',
    PHARMACIE = 'pharmacie',
    CENTRE_ANALYSE = 'centre_analyse',
    CLINIQUE = 'clinique',
}

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true, unique: true })
    phone: string;

    @Prop({ required: true, enum: UserRole })
    role: UserRole;

    @Prop({ default: false })
    isEmailVerified: boolean;

    @Prop({ default: false })
    isProfileCompleted: boolean;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    resetPasswordToken: string;

    @Prop()
    resetPasswordExpires: Date;

    @Prop()
    lastLoginAt: Date;

    @Prop({ type: Types.ObjectId, ref: 'PatientInformation' })
    patientInformation: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
