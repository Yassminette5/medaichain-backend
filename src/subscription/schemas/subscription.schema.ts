import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

export enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionSource {
  REVENUECAT = 'revenuecat',
  DEMO = 'demo',
  MANUAL = 'manual',
}

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ enum: SubscriptionPlan, default: SubscriptionPlan.FREE })
  plan: SubscriptionPlan;

  @Prop({ default: 0 })
  aiCredits: number;

  @Prop({ default: 0 })
  monthlyAiUsage: number;

  @Prop()
  revenueCatCustomerId: string;

  @Prop()
  revenueCatTransactionId: string;

  @Prop({ enum: SubscriptionSource })
  source: SubscriptionSource;

  @Prop()
  subscriptionStart: Date;

  @Prop()
  subscriptionEnd: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastResetDate: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ userId: 1 }, { unique: true });
SubscriptionSchema.index({ plan: 1 });
SubscriptionSchema.index({ revenueCatCustomerId: 1 });
