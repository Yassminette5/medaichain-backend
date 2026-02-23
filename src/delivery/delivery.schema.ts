import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeliveryDocument = Delivery & Document;

export enum DeliveryStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Delivery {
  @Prop({ type: Types.ObjectId, ref: 'MedicationRequest', required: true })
  medicationRequestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PharmacyProfile', required: true })
  pharmacyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PatientProfile', required: true })
  patientId: Types.ObjectId;

  @Prop({ enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status: DeliveryStatus;

  @Prop()
  deliveryAddress: string;

  @Prop()
  deliveryCity: string;

  @Prop()
  deliveryPostalCode: string;

  @Prop()
  gpsLatitude: number;

  @Prop()
  gpsLongitude: number;

  @Prop()
  estimatedDeliveryTime: Date;

  @Prop()
  actualDeliveryTime: Date;

  @Prop()
  deliveryFee: number;

  @Prop()
  notes: string;

  @Prop()
  driverId: string;

  @Prop()
  driverName: string;

  @Prop()
  driverPhone: string;

  @Prop()
  trackingCode: string;
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);
