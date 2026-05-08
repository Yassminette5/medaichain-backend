import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClinicDocument = Clinic & Document;

@Schema({ timestamps: true })
export class Clinic {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    ownerId: Types.ObjectId; // Le user (role=clinique) qui a créé cette clinique

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    address: string;

    @Prop()
    phoneNumber: string;

    @Prop({ unique: true, sparse: true })
    email: string;

    @Prop()
    city: string;

    @Prop()
    wilaya: string;

    @Prop()
    description: string;

    @Prop()
    logo: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const ClinicSchema = SchemaFactory.createForClass(Clinic);
