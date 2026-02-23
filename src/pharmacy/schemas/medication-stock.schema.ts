import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum StockLevel {
  CRITICAL = 'critical',
  ALERT = 'alert',
  NORMAL = 'normal',
}

@Schema({ timestamps: true })
export class MedicationStock extends Document {
  @Prop({ required: true })
  pharmacyId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  dosage: string;

  @Prop({ required: true, min: 0 })
  currentStock: number;

  @Prop({ required: true, min: 1 })
  maxStock: number;

  @Prop({ default: 'unités' })
  unit: string;

  @Prop({ type: String, enum: StockLevel })
  stockLevel: StockLevel;
}

export const MedicationStockSchema = SchemaFactory.createForClass(MedicationStock);

// Middleware to calculate stock level before saving
MedicationStockSchema.pre('save', function (next) {
  const percentage = (this.currentStock / this.maxStock) * 100;
  if (percentage <= 8) {
    this.stockLevel = StockLevel.CRITICAL;
  } else if (percentage <= 12) {
    this.stockLevel = StockLevel.ALERT;
  } else {
    this.stockLevel = StockLevel.NORMAL;
  }
  next();
});

@Schema()
export class StockSettings extends Document {
  @Prop({ required: true, unique: true })
  pharmacyId: string;

  @Prop({ default: true })
  pushNotificationsEnabled: boolean;

  @Prop({ default: true })
  weeklyReportsEnabled: boolean;

  @Prop({ default: 8, min: 1 })
  criticalStockThreshold: number;

  @Prop({ default: 12, min: 1 })
  alertStockThreshold: number;
}

export const StockSettingsSchema = SchemaFactory.createForClass(StockSettings);
