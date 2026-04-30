import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PrescriptionDocument = Prescription & Document;

export class Medication {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    dosage: string;

    @Prop({ required: true })
    frequency: string;

    @Prop({ required: true })
    duration: string;

    @Prop()
    instructions?: string;
}

@Schema({ timestamps: true })
export class Prescription {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    patientId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    doctorId: Types.ObjectId;

    @Prop({ type: [Medication], required: true })
    medications: Medication[];

    @Prop()
    diagnosis?: string;

    @Prop()
    notes?: string;

    @Prop()
    prescriptionImageUrl?: string;

    @Prop({ default: 'active', enum: ['active', 'completed', 'cancelled'] })
    status: string;

    @Prop()
    prescriptionDate: Date;

    // Relationship to NftAsset (stores all authoritative NFT data)
    @Prop({ type: Types.ObjectId, ref: 'NftAsset' })
    nftAssetId?: Types.ObjectId;

    // Convenience fields (denormalized from NftAsset for faster queries)
    @Prop()
    nftTokenId?: string;

    @Prop()
    nftMintTxHash?: string;

    @Prop()
    nftContractAddress?: string;

    @Prop()
    nftChainId?: number;
}

export const PrescriptionSchema = SchemaFactory.createForClass(Prescription);
