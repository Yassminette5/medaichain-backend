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
exports.UpdateMedicationRequestDto = exports.CreateMedicationRequestDto = exports.PatientLocationDto = exports.MedicationItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const medication_request_schema_1 = require("../schemas/medication-request.schema");
class MedicationItemDto {
    constructor() {
        this.unit = 'unités';
    }
}
exports.MedicationItemDto = MedicationItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicationItemDto.prototype, "medicationName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicationItemDto.prototype, "medicationDosage", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], MedicationItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MedicationItemDto.prototype, "unit", void 0);
class PatientLocationDto {
}
exports.PatientLocationDto = PatientLocationDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PatientLocationDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PatientLocationDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatientLocationDto.prototype, "address", void 0);
class CreateMedicationRequestDto {
    constructor() {
        this.isUrgent = false;
        this.requestsDelivery = false;
    }
}
exports.CreateMedicationRequestDto = CreateMedicationRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicationRequestDto.prototype, "patientId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicationRequestDto.prototype, "patientName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMedicationRequestDto.prototype, "patientPhone", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PatientLocationDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", PatientLocationDto)
], CreateMedicationRequestDto.prototype, "patientLocation", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MedicationItemDto),
    __metadata("design:type", Array)
], CreateMedicationRequestDto.prototype, "medications", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateMedicationRequestDto.prototype, "isUrgent", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateMedicationRequestDto.prototype, "requestsDelivery", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMedicationRequestDto.prototype, "prescriptionImageUrl", void 0);
class UpdateMedicationRequestDto {
}
exports.UpdateMedicationRequestDto = UpdateMedicationRequestDto;
__decorate([
    (0, class_validator_1.IsEnum)(medication_request_schema_1.RequestStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMedicationRequestDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateMedicationRequestDto.prototype, "isUrgent", void 0);
//# sourceMappingURL=create-medication-request.dto.js.map