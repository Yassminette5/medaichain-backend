import { PaymentStatus, PaymentMethod } from '../schemas/invoice.schema';
export declare class InvoiceItemDto {
    label: string;
    quantity?: number;
    unitPrice: number;
}
export declare class InsuranceDetailsDto {
    provider?: string;
    policyNumber?: string;
    coveragePercentage?: number;
    amountCovered?: number;
}
export declare class CreateInvoiceDto {
    patientId: string;
    doctorId?: string;
    appointmentId?: string;
    medicalRecordId?: string;
    items: InvoiceItemDto[];
    discount?: number;
    discountPercentage?: number;
    tax?: number;
    paymentMethod?: PaymentMethod;
    insuranceDetails?: InsuranceDetailsDto;
    patientName?: string;
    doctorName?: string;
    notes?: string;
}
declare const UpdateInvoiceDto_base: import("@nestjs/common").Type<Partial<CreateInvoiceDto>>;
export declare class UpdateInvoiceDto extends UpdateInvoiceDto_base {
    paymentStatus?: PaymentStatus;
    amountPaid?: number;
}
export {};
