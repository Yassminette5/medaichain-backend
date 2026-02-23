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
exports.UpdateClinicDoctorDto = exports.AddDoctorToClinicDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const clinic_doctor_schema_1 = require("../schemas/clinic-doctor.schema");
class AddDoctorToClinicDto {
    doctorId;
    fullName;
    speciality;
    phone;
    email;
    workingDays;
    workingHoursStart;
    workingHoursEnd;
    consultationFee;
}
exports.AddDoctorToClinicDto = AddDoctorToClinicDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID du user médecin', example: '60d5ec49f1b2c72b7c8e4a3d' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddDoctorToClinicDto.prototype, "doctorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Dr. Ahmed Benali' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddDoctorToClinicDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Cardiologie' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddDoctorToClinicDto.prototype, "speciality", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '0551234567' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddDoctorToClinicDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'dr.ahmed@email.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddDoctorToClinicDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Lundi', 'Mardi', 'Mercredi'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], AddDoctorToClinicDto.prototype, "workingDays", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '08:00' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddDoctorToClinicDto.prototype, "workingHoursStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '17:00' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddDoctorToClinicDto.prototype, "workingHoursEnd", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddDoctorToClinicDto.prototype, "consultationFee", void 0);
class UpdateClinicDoctorDto {
    speciality;
    workingDays;
    workingHoursStart;
    workingHoursEnd;
    consultationFee;
    status;
}
exports.UpdateClinicDoctorDto = UpdateClinicDoctorDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateClinicDoctorDto.prototype, "speciality", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateClinicDoctorDto.prototype, "workingDays", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateClinicDoctorDto.prototype, "workingHoursStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateClinicDoctorDto.prototype, "workingHoursEnd", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateClinicDoctorDto.prototype, "consultationFee", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(clinic_doctor_schema_1.DoctorStatus),
    __metadata("design:type", String)
], UpdateClinicDoctorDto.prototype, "status", void 0);
//# sourceMappingURL=clinic-doctor.dto.js.map