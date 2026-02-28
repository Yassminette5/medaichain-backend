import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LabAppointmentDocument = LabAppointment & Document;

export enum AnalysisType {
    ANALYSE_SANGUIN = 'analyse_sanguin',
    SCANNER = 'scanner',
    RADIOLOGIE = 'radiologie',
    IMAGERIE = 'imagerie',
    BIOLOGIE = 'biologie',
    AUTRE = 'autre',
}

@Schema({ timestamps: true, collection: 'lab_appointments' })
export class LabAppointment {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    patientId: Types.ObjectId; // ID du patient qui prend le RDV

    @Prop({ type: Types.ObjectId, ref: 'LabProfile' })
    labId?: Types.ObjectId; // ID du laboratoire (LabProfile._id)

    @Prop({ required: true })
    centreName: string; // Nom du centre d'analyse choisi

    @Prop({ required: true, enum: Object.values(AnalysisType) })
    analysisType: AnalysisType; // Type d'analyse

    @Prop()
    analysisTypeOther?: string; // Si type = AUTRE, préciser

    @Prop({ required: true })
    appointmentDate: Date; // Date et heure du RDV

    @Prop({ default: false })
    hasCurrentTreatment: boolean; // Traitement médical en cours

    @Prop()
    currentTreatmentDetails?: string;

    @Prop({ default: false })
    hasAllergies: boolean;

    @Prop([String])
    allergiesDetails?: string[];

    @Prop({ default: 'pending', enum: ['pending', 'accepted', 'rejected'] })
    status: 'pending' | 'accepted' | 'rejected';

    @Prop()
    notes?: string;
}

export const LabAppointmentSchema = SchemaFactory.createForClass(LabAppointment);
