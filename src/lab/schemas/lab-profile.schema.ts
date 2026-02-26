import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LabProfileDocument = LabProfile & Document;

@Schema({ timestamps: true })
export class LabProfile {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    centreName: string; // Nom du centre

    @Prop({ type: [String], required: true, default: [] })
    categorie: string[]; // Liste des catégories d'analyse (Biologie, Radiologie, Imagerie...)

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

    @Prop({ default: false })
    isActive: boolean; // Le labo peut activer/désactiver son compte

    @Prop({ type: Object, required: false })
    openingHours?: {
        lundi?: { open: string; close: string; isOpen: boolean };
        mardi?: { open: string; close: string; isOpen: boolean };
        mercredi?: { open: string; close: string; isOpen: boolean };
        jeudi?: { open: string; close: string; isOpen: boolean };
        vendredi?: { open: string; close: string; isOpen: boolean };
        samedi?: { open: string; close: string; isOpen: boolean };
        dimanche?: { open: string; close: string; isOpen: boolean };
    }; // Horaires d'ouverture par jour de la semaine (format: "HH:mm")
}

export const LabProfileSchema = SchemaFactory.createForClass(LabProfile);
