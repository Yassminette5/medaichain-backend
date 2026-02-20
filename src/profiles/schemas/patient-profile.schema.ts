import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientProfileDocument = PatientProfile & Document;

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
}

@Schema({ timestamps: true })
export class PatientProfile {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    fullName: string;

    @Prop()
    age: number;

    @Prop({ enum: Gender })
    gender: Gender;

    @Prop([String])
    allergies: string[];

    @Prop()
    height: number; // en cm

    @Prop()
    weight: number; // en kg
}

export const PatientProfileSchema = SchemaFactory.createForClass(PatientProfile);
