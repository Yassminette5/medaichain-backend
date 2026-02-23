"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateInvoiceDto = exports.CreateInvoiceDto = exports.InsuranceDetailsDto = exports.InvoiceItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const invoice_schema_1 = require("../schemas/invoice.schema");
class InvoiceItemDto {
    label;
    quantity;
    unitPrice;
}
exports.InvoiceItemDto = InvoiceItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Consultation générale', description: 'Libellé' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InvoiceItemDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, description: 'Quantité' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InvoiceItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3000, description: 'Prix unitaire en DA' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InvoiceItemDto.prototype, "unitPrice", void 0);
class InsuranceDetailsDto {
    provider;
    policyNumber;
    coveragePercentage;
    amountCovered;
}
exports.InsuranceDetailsDto = InsuranceDetailsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'CNAS', description: 'Organisme assureur' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsuranceDetailsDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'POL-2026-12345', description: 'Numéro de police' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsuranceDetailsDto.prototype, "policyNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 80, description: 'Pourcentage couvert' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsuranceDetailsDto.prototype, "coveragePercentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2400, description: 'Montant couvert en DA' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsuranceDetailsDto.prototype, "amountCovered", void 0);
class CreateInvoiceDto {
    patientId;
    doctorId;
    appointmentId;
    medicalRecordId;
    items;
    discount;
    discountPercentage;
    tax;
    paymentMethod;
    insuranceDetails;
    patientName;
    doctorName;
    notes;
}
exports.CreateInvoiceDto = CreateInvoiceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '507f1f77bcf86cd799439011', description: 'ID du patient' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '507f1f77bcf86cd799439012', description: 'ID du médecin' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "doctorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '507f1f77bcf86cd799439013', description: 'ID du rendez-vous' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "appointmentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '507f1f77bcf86cd799439014', description: 'ID du dossier médical' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "medicalRecordId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InvoiceItemDto], description: 'Lignes de la facture' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => InvoiceItemDto),
    __metadata("design:type", Array)
], CreateInvoiceDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 500, description: 'Remise en DA' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "discount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10, description: 'Remise en %' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "discountPercentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0, description: 'TVA' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "tax", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: invoice_schema_1.PaymentMethod, description: 'Mode de paiement' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(invoice_schema_1.PaymentMethod),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: InsuranceDetailsDto, description: 'Détails assurance' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => InsuranceDetailsDto),
    __metadata("design:type", InsuranceDetailsDto)
], CreateInvoiceDto.prototype, "insuranceDetails", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ahmed Ben Ali' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "patientName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Dr. Karim Bouzid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "doctorName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notes sur la facture' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "notes", void 0);
class UpdateInvoiceDto extends (0, swagger_1.PartialType)(CreateInvoiceDto) {
    paymentStatus;
    amountPaid;
}
exports.UpdateInvoiceDto = UpdateInvoiceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: invoice_schema_1.PaymentStatus, description: 'Statut du paiement' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(invoice_schema_1.PaymentStatus),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "paymentStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3000, description: 'Montant payé' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "amountPaid", void 0);
//# sourceMappingURL=invoice.dto.js.map