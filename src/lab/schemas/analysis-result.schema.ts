import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AnalysisType } from './analysis-type.enum';

export type AnalysisResultDocument = AnalysisResult & Document;

@Schema({ timestamps: true })
export class AnalysisResult {
    @Prop({ type: Types.ObjectId, ref: 'LabProfile', required: true })
    labId: Types.ObjectId; // ID du centre d'analyse qui a uploadé

    @Prop({ required: true })
    patientName: string; // Nom du patient

    @Prop({ required: true })
    patientEmail: string; // Email du patient

    @Prop({ required: true, enum: AnalysisType })
    analysisType: AnalysisType; // Type d'analyse

    @Prop()
    analysisTypeOther?: string; // Si type = AUTRE, préciser le type

    @Prop({ required: true })
    analysisDate: Date; // Date de l'analyse

    @Prop({ required: true })
    resultFile: string; // Chemin du fichier de résultat (PDF, JPG, PNG, DOC, DOCX)

    @Prop()
    notes?: string; // Notes optionnelles
}

export const AnalysisResultSchema = SchemaFactory.createForClass(AnalysisResult);
