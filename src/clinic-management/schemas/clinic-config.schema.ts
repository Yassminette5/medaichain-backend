import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClinicConfigDocument = ClinicConfig & Document;

@Schema({ timestamps: true })
export class ClinicConfig {
    @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true, unique: true })
    clinicId: Types.ObjectId;

    @Prop({ required: true, default: 'http://localhost:5005' })
    adherenceModelUrl: string;

    @Prop({ default: true })
    isAiAnalysisEnabled: boolean;

    @Prop({ type: Object, default: {} })
    additionalSettings: Record<string, any>;
}

export const ClinicConfigSchema = SchemaFactory.createForClass(ClinicConfig);
