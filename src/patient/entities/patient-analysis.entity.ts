import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientAnalysisDocument = PatientAnalysis & Document;

export enum AnalysisSource {
    CENTRE_ANALYSE = 'centre_analyse',
    PATIENT = 'patient',
}

@Schema({ timestamps: true })
export class PatientAnalysis {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    analysisType: string;

    @Prop()
    analysisTypeOther?: string;

    @Prop({ required: true })
    analysisDate: Date;

    @Prop({ required: true, enum: AnalysisSource })
    source: AnalysisSource;

    @Prop()
    centreName?: string;

    @Prop({ required: true })
    resultFile: string;

    @Prop()
    notes?: string;

    @Prop({ default: 'en_attente' })
    status: string;

    @Prop()
    aiDiagnosis?: string;

    @Prop()
    aiAdvice?: string;

    @Prop({ type: Types.ObjectId, ref: 'Prescription' })
    prescriptionId?: Types.ObjectId;
}

export const PatientAnalysisSchema = SchemaFactory.createForClass(PatientAnalysis);

PatientAnalysisSchema.index({ userId: 1, analysisDate: -1 });
