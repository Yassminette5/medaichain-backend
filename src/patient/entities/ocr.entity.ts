import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type OCRDataDocument = OCRData & Document;

@Schema({ timestamps: true, strict: false })
export class OCRData {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop()
    title: string;

    @Prop({ required: true })
    image_name: string;

    @Prop()
    description?: string;

    // Optionnels pour compatibilité avec différents modèles OCR
    @Prop({ type: String, enum: ['lab', 'patient'], required: false })
    sourceType?: 'lab' | 'patient';

    @Prop({ type: String, required: false })
    mimeType?: string;

    @Prop({ type: MongooseSchema.Types.Mixed, required: false })
    result?: Record<string, any>;

    // Additional dynamic fields will be stored due to strict: false
    // This allows for flexible document types (prescriptions, analyses, etc.)
}

export const OCRDataSchema = SchemaFactory.createForClass(OCRData);

// Add indexes for better query performance
OCRDataSchema.index({ userId: 1, createdAt: -1 });
