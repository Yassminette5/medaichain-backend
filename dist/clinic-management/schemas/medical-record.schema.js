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
exports.MedicalRecordSchema = exports.MedicalRecord = exports.Medication = exports.VitalSigns = exports.RecordType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var RecordType;
(function (RecordType) {
    RecordType["CONSULTATION"] = "consultation";
    RecordType["ANALYSE"] = "analyse";
    RecordType["CHIRURGIE"] = "chirurgie";
    RecordType["URGENCE"] = "urgence";
    RecordType["SUIVI"] = "suivi";
    RecordType["VACCINATION"] = "vaccination";
})(RecordType || (exports.RecordType = RecordType = {}));
let VitalSigns = class VitalSigns {
    bloodPressureSystolic;
    bloodPressureDiastolic;
    heartRate;
    temperature;
    weight;
    height;
    oxygenSaturation;
    bloodSugar;
};
exports.VitalSigns = VitalSigns;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], VitalSigns.prototype, "bloodPressureSystolic", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], VitalSigns.prototype, "bloodPressureDiastolic", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], VitalSigns.prototype, "heartRate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], VitalSigns.prototype, "temperature", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], VitalSigns.prototype, "weight", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], VitalSigns.prototype, "height", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], VitalSigns.prototype, "oxygenSaturation", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], VitalSigns.prototype, "bloodSugar", void 0);
exports.VitalSigns = VitalSigns = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], VitalSigns);
let Medication = class Medication {
    name;
    dosage;
    frequency;
    duration;
    instructions;
};
exports.Medication = Medication;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Medication.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Medication.prototype, "dosage", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Medication.prototype, "frequency", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Medication.prototype, "duration", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Medication.prototype, "instructions", void 0);
exports.Medication = Medication = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Medication);
let MedicalRecord = class MedicalRecord {
    clinicId;
    patientId;
    doctorId;
    appointmentId;
    type;
    date;
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
};
exports.MedicalRecord = MedicalRecord;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Clinic', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MedicalRecord.prototype, "clinicId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MedicalRecord.prototype, "patientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MedicalRecord.prototype, "doctorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Appointment' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MedicalRecord.prototype, "appointmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: RecordType, default: RecordType.CONSULTATION }),
    __metadata("design:type", String)
], MedicalRecord.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], MedicalRecord.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalRecord.prototype, "chiefComplaint", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], MedicalRecord.prototype, "symptoms", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalRecord.prototype, "physicalExamination", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalRecord.prototype, "diagnosis", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], MedicalRecord.prototype, "differentialDiagnosis", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: VitalSigns }),
    __metadata("design:type", VitalSigns)
], MedicalRecord.prototype, "vitalSigns", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Medication], default: [] }),
    __metadata("design:type", Array)
], MedicalRecord.prototype, "prescription", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], MedicalRecord.prototype, "labTestsRequested", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalRecord.prototype, "labResults", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], MedicalRecord.prototype, "imagingRequested", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalRecord.prototype, "imagingResults", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], MedicalRecord.prototype, "attachments", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], MedicalRecord.prototype, "followUpDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalRecord.prototype, "followUpNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalRecord.prototype, "doctorNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalRecord.prototype, "patientName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalRecord.prototype, "doctorName", void 0);
exports.MedicalRecord = MedicalRecord = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MedicalRecord);
exports.MedicalRecordSchema = mongoose_1.SchemaFactory.createForClass(MedicalRecord);
exports.MedicalRecordSchema.index({ clinicId: 1, patientId: 1, date: -1 });
exports.MedicalRecordSchema.index({ clinicId: 1, doctorId: 1, date: -1 });
exports.MedicalRecordSchema.index({ patientId: 1, date: -1 });
//# sourceMappingURL=medical-record.schema.js.map