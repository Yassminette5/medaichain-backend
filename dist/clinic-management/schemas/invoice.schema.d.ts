import { Document, Types } from 'mongoose';
export type InvoiceDocument = Invoice & Document;
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    PARTIAL = "partial",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export declare enum PaymentMethod {
    CASH = "cash",
    CARD = "card",
    INSURANCE = "insurance",
    BANK_TRANSFER = "bank_transfer",
    CHEQUE = "cheque"
}
export declare class InvoiceItem {
    label: string;
    quantity: number;
    unitPrice: number;
    total: number;
}
export declare class InsuranceDetails {
    provider: string;
    policyNumber: string;
    coveragePercentage: number;
    amountCovered: number;
}
export declare class Invoice {
    invoiceNumber: string;
    clinicId: Types.ObjectId;
    patientId: Types.ObjectId;
    doctorId: Types.ObjectId;
    appointmentId: Types.ObjectId;
    medicalRecordId: Types.ObjectId;
    date: Date;
    items: InvoiceItem[];
    subtotal: number;
    discount: number;
    discountPercentage: number;
    tax: number;
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    paidAt: Date;
    insuranceDetails: InsuranceDetails;
    patientName: string;
    doctorName: string;
    notes: string;
}
export declare const InvoiceSchema: import("mongoose").Schema<Invoice, import("mongoose").Model<Invoice, any, any, any, Document<unknown, any, Invoice, any, {}> & Invoice & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Invoice, Document<unknown, {}, import("mongoose").FlatRecord<Invoice>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Invoice> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
