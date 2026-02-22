import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    PARTIAL = 'partial',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded',
}

export enum PaymentMethod {
    CASH = 'cash',
    CARD = 'card',
    INSURANCE = 'insurance',
    BANK_TRANSFER = 'bank_transfer',
    CHEQUE = 'cheque',
}

@Schema({ _id: false })
export class InvoiceItem {
    @Prop({ required: true })
    label: string; // "Consultation", "Radio", "Analyse sang"

    @Prop({ default: 1 })
    quantity: number;

    @Prop({ required: true })
    unitPrice: number; // Prix unitaire en DA

    @Prop()
    total: number; // quantity * unitPrice
}

@Schema({ _id: false })
export class InsuranceDetails {
    @Prop()
    provider: string; // CNAS, CASNOS, privée

    @Prop()
    policyNumber: string; // Numéro de police

    @Prop()
    coveragePercentage: number; // % couvert

    @Prop()
    amountCovered: number; // Montant couvert
}

@Schema({ timestamps: true })
export class Invoice {
    @Prop({ required: true, unique: true })
    invoiceNumber: string; // FAC-2026-001

    @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
    clinicId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    patientId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    doctorId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Appointment' })
    appointmentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'MedicalRecord' })
    medicalRecordId: Types.ObjectId;

    @Prop({ required: true })
    date: Date;

    // Détails de la facture
    @Prop({ type: [InvoiceItem], default: [] })
    items: InvoiceItem[];

    @Prop({ default: 0 })
    subtotal: number; // Sous-total

    @Prop({ default: 0 })
    discount: number; // Remise en DA

    @Prop({ default: 0 })
    discountPercentage: number; // Remise en %

    @Prop({ default: 0 })
    tax: number; // TVA

    @Prop({ required: true })
    totalAmount: number; // Montant total TTC

    @Prop({ default: 0 })
    amountPaid: number; // Montant payé

    @Prop({ default: 0 })
    amountDue: number; // Reste à payer

    // Paiement
    @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
    paymentStatus: PaymentStatus;

    @Prop({ enum: PaymentMethod })
    paymentMethod: PaymentMethod;

    @Prop()
    paidAt: Date;

    // Assurance
    @Prop({ type: InsuranceDetails })
    insuranceDetails: InsuranceDetails;

    // Infos dénormalisées
    @Prop()
    patientName: string;

    @Prop()
    doctorName: string;

    @Prop()
    notes: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// Indexes
InvoiceSchema.index({ clinicId: 1, date: -1 });
InvoiceSchema.index({ clinicId: 1, paymentStatus: 1 });
InvoiceSchema.index({ patientId: 1, date: -1 });
InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
