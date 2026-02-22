import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OCRDataDocument = OCRData & Document;

@Schema({ timestamps: true, strict: false })
export class OCRData {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    image_name: string;

    @Prop()
    description?: string;

    // Additional dynamic fields will be stored due to strict: false
    // This allows for flexible document types (prescriptions, analyses, etc.)
}

export const OCRDataSchema = SchemaFactory.createForClass(OCRData);

// Add indexes for better query performance
OCRDataSchema.index({ userId: 1, createdAt: -1 });
