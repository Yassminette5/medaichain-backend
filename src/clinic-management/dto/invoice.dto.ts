import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum, IsDateString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus, PaymentMethod } from '../schemas/invoice.schema';

export class InvoiceItemDto {
    @ApiProperty({ example: 'Consultation générale', description: 'Libellé' })
    @IsString()
    label: string;

    @ApiPropertyOptional({ example: 1, description: 'Quantité' })
    @IsOptional() @IsNumber()
    quantity?: number;

    @ApiProperty({ example: 3000, description: 'Prix unitaire en DA' })
    @IsNumber()
    unitPrice: number;
}

export class InsuranceDetailsDto {
    @ApiPropertyOptional({ example: 'CNAS', description: 'Organisme assureur' })
    @IsOptional() @IsString()
    provider?: string;

    @ApiPropertyOptional({ example: 'POL-2026-12345', description: 'Numéro de police' })
    @IsOptional() @IsString()
    policyNumber?: string;

    @ApiPropertyOptional({ example: 80, description: 'Pourcentage couvert' })
    @IsOptional() @IsNumber()
    coveragePercentage?: number;

    @ApiPropertyOptional({ example: 2400, description: 'Montant couvert en DA' })
    @IsOptional() @IsNumber()
    amountCovered?: number;
}

export class CreateInvoiceDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'ID du patient' })
    @IsString()
    patientId: string;

    @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012', description: 'ID du médecin' })
    @IsOptional() @IsString()
    doctorId?: string;

    @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013', description: 'ID du rendez-vous' })
    @IsOptional() @IsString()
    appointmentId?: string;

    @ApiPropertyOptional({ example: '507f1f77bcf86cd799439014', description: 'ID du dossier médical' })
    @IsOptional() @IsString()
    medicalRecordId?: string;

    @ApiProperty({ type: [InvoiceItemDto], description: 'Lignes de la facture' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    items: InvoiceItemDto[];

    @ApiPropertyOptional({ example: 500, description: 'Remise en DA' })
    @IsOptional() @IsNumber()
    discount?: number;

    @ApiPropertyOptional({ example: 10, description: 'Remise en %' })
    @IsOptional() @IsNumber()
    discountPercentage?: number;

    @ApiPropertyOptional({ example: 0, description: 'TVA' })
    @IsOptional() @IsNumber()
    tax?: number;

    @ApiPropertyOptional({ enum: PaymentMethod, description: 'Mode de paiement' })
    @IsOptional() @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @ApiPropertyOptional({ type: InsuranceDetailsDto, description: 'Détails assurance' })
    @IsOptional() @ValidateNested()
    @Type(() => InsuranceDetailsDto)
    insuranceDetails?: InsuranceDetailsDto;

    @ApiPropertyOptional({ example: 'Ahmed Ben Ali' })
    @IsOptional() @IsString()
    patientName?: string;

    @ApiPropertyOptional({ example: 'Dr. Karim Bouzid' })
    @IsOptional() @IsString()
    doctorName?: string;

    @ApiPropertyOptional({ description: 'Notes sur la facture' })
    @IsOptional() @IsString()
    notes?: string;
}

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
    @ApiPropertyOptional({ enum: PaymentStatus, description: 'Statut du paiement' })
    @IsOptional() @IsEnum(PaymentStatus)
    paymentStatus?: PaymentStatus;

    @ApiPropertyOptional({ example: 3000, description: 'Montant payé' })
    @IsOptional() @IsNumber()
    amountPaid?: number;
}
