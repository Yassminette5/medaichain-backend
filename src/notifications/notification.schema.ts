import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  DELIVERY_STATUS = 'delivery_status',
  PRESCRIPTION_UPDATE = 'prescription_update',
  PHARMACY_MESSAGE = 'pharmacy_message',
  SYSTEM_ALERT = 'system_alert',
  APPOINTMENT = 'appointment',
  PAYMENT = 'payment',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  relatedId: string; // ID de la ressource liée (delivery, prescription, etc.)

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt: Date;

  @Prop({ type: Object, default: {} })
  data: Record<string, any>; // Données additionnelles

  @Prop({ default: true })
  isActive: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
