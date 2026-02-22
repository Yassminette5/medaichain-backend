import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClinicDoctorDocument = ClinicDoctor & Document;

export enum DoctorStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PENDING = 'pending',
}

@Schema({ timestamps: true })
export class ClinicDoctor {
    @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
    clinicId: Types.ObjectId; // FK → Clinic

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    doctorId: Types.ObjectId; // FK → User (role=medecin)

    @Prop({ required: true })
    fullName: string;

    @Prop()
    speciality: string;

    @Prop()
    phone: string;

    @Prop()
    email: string;

    @Prop({ type: [String], default: [] })
    workingDays: string[]; // ['Lundi', 'Mardi', ...]

    @Prop()
    workingHoursStart: string; // "08:00"

    @Prop()
    workingHoursEnd: string; // "17:00"

    @Prop({ default: 0 })
    consultationFee: number;

    @Prop({ enum: DoctorStatus, default: DoctorStatus.ACTIVE })
    status: DoctorStatus;
}

export const ClinicDoctorSchema = SchemaFactory.createForClass(ClinicDoctor);
