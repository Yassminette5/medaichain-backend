import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdmissionDocument = Admission & Document;

export enum AdmissionStatus {
    WAITING = 'waiting',
    IN_CONSULTATION = 'in_consultation',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Admission {
    @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
    clinicId: Types.ObjectId; // FK → Clinic

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    patientId: Types.ObjectId; // FK → User (role=patient)

    @Prop({ type: Types.ObjectId, ref: 'User' })
    doctorId: Types.ObjectId; // FK → User (role=medecin) - médecin assigné

    @Prop({ required: true })
    patientName: string;

    @Prop()
    patientPhone: string;

    @Prop({ required: true })
    reason: string; // Motif d'admission

    @Prop({ required: true })
    date: Date;

    @Prop({ enum: AdmissionStatus, default: AdmissionStatus.WAITING })
    status: AdmissionStatus;

    @Prop()
    queueNumber: number; // Numéro dans la file d'attente

    @Prop()
    notes: string;

    // --- AI Triage Fields ---
    @Prop()
    triageStatus: string; // 'ROUTINE', 'URGENT', 'CRITIQUE'
    
    @Prop()
    triageColor: string; // 'green', 'orange', 'red'
    
    @Prop()
    triageRecommendation: string;
    
    @Prop()
    triageConfidence: number;
}

export const AdmissionSchema = SchemaFactory.createForClass(Admission);
