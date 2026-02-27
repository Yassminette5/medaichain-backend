import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientInformationDocument = PatientInformation & Document;

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
}

@Schema({ timestamps: true })
export class PatientInformation {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    fullName: string;

    @Prop()
    age: number;

    @Prop({ type: String, enum: Gender, default: undefined })
    gender?: Gender;

    @Prop([String])
    allergies: string[];

    @Prop([String])
    chronicDiseases: string[];

    @Prop()
    height: number; // en cm

    @Prop()
    weight: number; // en kg
}

export const PatientInformationSchema = SchemaFactory.createForClass(PatientInformation);
