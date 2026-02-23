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
exports.UpdateMedicalRecordDto = exports.CreateMedicalRecordDto = exports.MedicationDto = exports.VitalSignsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const medical_record_schema_1 = require("../schemas/medical-record.schema");
class VitalSignsDto {
    bloodPressureSystolic;
    bloodPressureDiastolic;
    heartRate;
    temperature;
    weight;
    height;
    oxygenSaturation;
    bloodSugar;
}
exports.VitalSignsDto = VitalSignsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 120, description: 'Pression systolique (mmHg)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], VitalSignsDto.prototype, "bloodPressureSystolic", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 80, description: 'Pression diastolique (mmHg)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], VitalSignsDto.prototype, "bloodPressureDiastolic", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 72, description: 'Fréquence cardiaque (bpm)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], VitalSignsDto.prototype, "heartRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 37.2, description: 'Température (°C)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], VitalSignsDto.prototype, "temperature", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 75, description: 'Poids (kg)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], VitalSignsDto.prototype, "weight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 175, description: 'Taille (cm)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], VitalSignsDto.prototype, "height", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 98, description: 'Saturation O2 (%)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], VitalSignsDto.prototype, "oxygenSaturation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0.95, description: 'Glycémie (g/L)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], VitalSignsDto.prototype, "bloodSugar", void 0);
class MedicationDto {
    name;
    dosage;
    frequency;
    duration;
    instructions;
}
exports.MedicationDto = MedicationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Amoxicilline', description: 'Nom du médicament' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicationDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '500mg', description: 'Dosage' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicationDto.prototype, "dosage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '3 fois par jour', description: 'Fréquence' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicationDto.prototype, "frequency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '7 jours', description: 'Durée' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicationDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Après les repas', description: 'Instructions' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicationDto.prototype, "instructions", void 0);
class CreateMedicalRecordDto {
    patientId;
    doctorId;
    appointmentId;
    type;
    chiefComplaint;
    symptoms;
    physicalExamination;
    diagnosis;
    differentialDiagnosis;
    vitalSigns;
    prescription;
    labTestsRequested;
    labResults;
    imagingRequested;
    imagingResults;
    attachments;
    followUpDate;
    followUpNotes;
    doctorNotes;
    patientName;
    doctorName;
}
exports.CreateMedicalRecordDto = CreateMedicalRecordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '507f1f77bcf86cd799439011', description: 'ID du patient' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '507f1f77bcf86cd799439012', description: 'ID du médecin' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "doctorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '507f1f77bcf86cd799439013', description: 'ID du rendez-vous' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "appointmentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: medical_record_schema_1.RecordType, default: medical_record_schema_1.RecordType.CONSULTATION }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(medical_record_schema_1.RecordType),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Douleurs abdominales persistantes', description: 'Motif principal' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "chiefComplaint", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Douleur', 'Fièvre', 'Nausées'], description: 'Symptômes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateMedicalRecordDto.prototype, "symptoms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Examen physique' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "physicalExamination", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Gastrite aiguë', description: 'Diagnostic' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "diagnosis", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Ulcère gastrique', 'Appendicite'], description: 'Diagnostics différentiels' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateMedicalRecordDto.prototype, "differentialDiagnosis", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: VitalSignsDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => VitalSignsDto),
    __metadata("design:type", VitalSignsDto)
], CreateMedicalRecordDto.prototype, "vitalSigns", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [MedicationDto], description: 'Ordonnance' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MedicationDto),
    __metadata("design:type", Array)
], CreateMedicalRecordDto.prototype, "prescription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['NFS', 'CRP', 'Glycémie'], description: 'Analyses demandées' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateMedicalRecordDto.prototype, "labTestsRequested", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Résultats analyses' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "labResults", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Radiographie thorax'], description: 'Imagerie demandée' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateMedicalRecordDto.prototype, "imagingRequested", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Résultats imagerie' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "imagingResults", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Fichiers joints (URLs)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateMedicalRecordDto.prototype, "attachments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date prochain RDV' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "followUpDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Instructions de suivi' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "followUpNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notes du médecin' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "doctorNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ahmed Ben Ali' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "patientName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Dr. Karim Bouzid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "doctorName", void 0);
class UpdateMedicalRecordDto extends (0, swagger_1.PartialType)(CreateMedicalRecordDto) {
}
exports.UpdateMedicalRecordDto = UpdateMedicalRecordDto;
//# sourceMappingURL=medical-record.dto.js.map