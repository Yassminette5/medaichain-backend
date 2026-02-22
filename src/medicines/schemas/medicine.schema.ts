import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MedicineDocument = Medicine & Document;

@Schema({ timestamps: true })
export class Medicine {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    type: string; // pill, capsule, syringe, bottle, etc.

    @Prop()
    dosage: string; // e.g., "150mg, 1 capsule"

    @Prop({ type: [String] })
    schedule: string[]; // ['after_breakfast', 'after_dinner', etc.]

    @Prop()
    duration: string; // e.g., "1 Month"

    @Prop()
    frequency: string; // e.g., "Daily"

    @Prop()
    cause: string; // e.g., "Diabetes"

    @Prop()
    capSize: string; // e.g., "150 mg"

    @Prop()
    instructions: string;

    @Prop({ default: Date.now })
    startDate: Date;

    @Prop({ default: true })
    isActive: boolean;
}

export const MedicineSchema = SchemaFactory.createForClass(Medicine);
