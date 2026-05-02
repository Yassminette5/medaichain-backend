import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SharedPrescriptionDocument = SharedPrescription & Document;

@Schema({ timestamps: true })
export class SharedPrescription {
    @Prop({ type: Types.ObjectId, ref: 'Prescription', required: true })
    prescriptionId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    pharmacyId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    patientId: Types.ObjectId;

    @Prop({ default: () => new Date() })
    sharedAt: Date;
}

export const SharedPrescriptionSchema = SchemaFactory.createForClass(SharedPrescription);

// Compound index to prevent duplicate shares
SharedPrescriptionSchema.index(
    { prescriptionId: 1, pharmacyId: 1 },
    { unique: true },
);
