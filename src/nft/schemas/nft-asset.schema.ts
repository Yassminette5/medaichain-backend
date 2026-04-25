import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NftAssetType {
    PRESCRIPTION = 'prescription',
    MEDICAL_REPORT = 'medical_report',
    LAB_ANALYSIS = 'lab_analysis',
}

export enum NftAssetStatus {
    PENDING = 'pending',
    MINTED = 'minted',
    FAILED = 'failed',
}

export type NftAssetDocument = NftAsset & Document;

export class NftShareEntry {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    entityUserId: Types.ObjectId;

    @Prop({ required: true })
    grantedAt: Date;

    @Prop()
    expiresAt?: Date;
}

@Schema({ timestamps: true })
export class NftAsset {
    @Prop({ required: true, enum: NftAssetType })
    assetType: NftAssetType;

    @Prop({ type: Types.ObjectId, required: true })
    assetId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    ownerUserId: Types.ObjectId;

    @Prop({ required: true })
    ownerWallet: string;

    @Prop()
    contractAddress?: string;

    @Prop()
    tokenId?: string;

    @Prop()
    txHash?: string;

    @Prop()
    chainId?: number;

    @Prop({ required: true, enum: NftAssetStatus, default: NftAssetStatus.PENDING })
    status: NftAssetStatus;

    @Prop({ type: Object })
    metadata?: Record<string, any>;

    @Prop()
    metadataUri?: string;

    @Prop({ type: [NftShareEntry], default: [] })
    sharedWith: NftShareEntry[];

    @Prop()
    mintedAt?: Date;
}

export const NftAssetSchema = SchemaFactory.createForClass(NftAsset);
NftAssetSchema.index({ assetType: 1, assetId: 1 }, { unique: true });
