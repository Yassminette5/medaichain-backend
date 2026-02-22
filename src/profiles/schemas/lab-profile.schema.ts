import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LabProfileDocument = LabProfile & Document;

@Schema({ timestamps: true })
export class LabProfile {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    centreName: string; // Nom du centre

    @Prop({ required: true })
    categorie: string; // Catégorie (Biologie, Radiologie, Imagerie...)

    @Prop({ required: true })
    phone: string; // Téléphone du centre

    @Prop({ required: true })
    email: string; // Email du centre

    @Prop({ required: true })
    localisation: string; // Localisation (ville / adresse)

    @Prop()
    profilePhoto: string;

    @Prop({ default: false })
    isVerified: boolean;

    @Prop()
    verifiedAt: Date;
}

export const LabProfileSchema = SchemaFactory.createForClass(LabProfile);
