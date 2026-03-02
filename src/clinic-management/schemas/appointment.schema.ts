import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AppointmentDocument = Appointment & Document;

export enum AppointmentStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    NO_SHOW = 'no_show',
}

@Schema({ timestamps: true })
export class Appointment {
    @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
    clinicId: Types.ObjectId; // FK → Clinic

    @Prop({ type: Types.ObjectId, ref: 'User', required: false })
    doctorId: Types.ObjectId; // FK → User (role=medecin)

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    patientId: Types.ObjectId; // FK → User (role=patient)

    @Prop({ required: true })
    date: Date;

    @Prop({ required: true })
    timeSlot: string; // "09:00 - 09:30"

    @Prop({ enum: AppointmentStatus, default: AppointmentStatus.PENDING })
    status: AppointmentStatus;

    @Prop()
    reason: string; // Motif de consultation

    @Prop()
    notes: string; // Notes du médecin

    @Prop()
    diagnosis: string; // Diagnostic

    @Prop()
    prescription: string; // Ordonnance

    @Prop()
    patientName: string; // Nom du patient (dénormalisé pour affichage rapide)

    @Prop()
    doctorName: string; // Nom du médecin (dénormalisé pour affichage rapide)

    @Prop({ default: 'clinic' })
    source: string; // 'clinic' ou 'mobile'
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
