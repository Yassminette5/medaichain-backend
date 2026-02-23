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
exports.UpdateAdmissionDto = exports.CreateAdmissionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const admission_schema_1 = require("../schemas/admission.schema");
class CreateAdmissionDto {
    patientId;
    patientName;
    patientPhone;
    reason;
    doctorId;
    notes;
}
exports.CreateAdmissionDto = CreateAdmissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID du patient', example: '60d5ec49f1b2c72b7c8e4a3e' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ahmed Benali' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "patientName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '0551234567' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "patientPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Consultation générale' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID du médecin assigné' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "doctorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Patient recommandé par Dr. X' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "notes", void 0);
class UpdateAdmissionDto {
    status;
    doctorId;
    notes;
    patientName;
    patientPhone;
    reason;
}
exports.UpdateAdmissionDto = UpdateAdmissionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(admission_schema_1.AdmissionStatus),
    __metadata("design:type", String)
], UpdateAdmissionDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdmissionDto.prototype, "doctorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdmissionDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdmissionDto.prototype, "patientName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdmissionDto.prototype, "patientPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdmissionDto.prototype, "reason", void 0);
//# sourceMappingURL=admission.dto.js.map