import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccessRequestDocument = AccessRequest & Document;

export enum AccessRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REFUSED = 'refused',
}

export enum AccessRequestUrgency {
  NORMAL = 'normal',
  URGENT = 'urgent',
}

@Schema({ timestamps: true })
export class AccessRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctorId: Types.ObjectId;

  @Prop({ required: true })
  reason: string;

  @Prop({ default: AccessRequestUrgency.NORMAL, enum: Object.values(AccessRequestUrgency) })
  urgency: AccessRequestUrgency;

  @Prop({ default: AccessRequestStatus.PENDING, enum: Object.values(AccessRequestStatus) })
  status: AccessRequestStatus;

  @Prop()
  duration?: string;

  @Prop()
  respondedAt?: Date;
}

export const AccessRequestSchema = SchemaFactory.createForClass(AccessRequest);
