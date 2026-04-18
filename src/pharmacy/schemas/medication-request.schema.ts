import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum RequestStatus {
  TOUT = 'tout',
  URGENT = 'urgent',
  EN_ATTENTE = 'enAttente',
  VALIDE = 'valide',
  NON_VALIDE = 'nonValide',
  TERMINE = 'termine',
}

@Schema({ _id: false })
export class Patient {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  phoneNumber?: string;

  @Prop({ type: Object })
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

@Schema({ _id: false })
export class RequestedMedication {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  dosage?: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ default: 'unités' })
  unit: string;

  @Prop({ default: false })
  isValidated?: boolean;

  @Prop()
  validationNote?: string;
}

@Schema({ timestamps: true })
export class MedicationRequest extends Document {
  @Prop({ required: true })
  pharmacyId: string;

  @Prop({ type: Patient, required: true })
  patient: Patient;

  @Prop({ type: [RequestedMedication], required: true })
  medications: RequestedMedication[];

  @Prop({ type: String, enum: RequestStatus, default: RequestStatus.EN_ATTENTE })
  status: RequestStatus;

  @Prop({ default: Date.now })
  requestDate: Date;

  @Prop({ default: false })
  isUrgent: boolean;

  @Prop({ default: false })
  requestsDelivery: boolean;

  @Prop()
  prescriptionImageUrl?: string;

  @Prop()
  doctorName?: string;

  @Prop()
  validationNote?: string;

  @Prop()
  deliveryConfirmedAt?: Date;
}

export const MedicationRequestSchema = SchemaFactory.createForClass(MedicationRequest);
