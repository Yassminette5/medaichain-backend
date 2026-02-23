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
exports.MedicationRequestSchema = exports.MedicationRequest = exports.RequestedMedication = exports.Patient = exports.RequestStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["TOUT"] = "tout";
    RequestStatus["URGENT"] = "urgent";
    RequestStatus["EN_ATTENTE"] = "enAttente";
    RequestStatus["VALIDE"] = "valide";
    RequestStatus["NON_VALIDE"] = "nonValide";
    RequestStatus["TERMINE"] = "termine";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
let Patient = class Patient {
    id;
    name;
    phoneNumber;
    location;
};
exports.Patient = Patient;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Patient.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Patient.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "phoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], Patient.prototype, "location", void 0);
exports.Patient = Patient = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Patient);
let RequestedMedication = class RequestedMedication {
    id;
    name;
    dosage;
    quantity;
    unit;
    isValidated;
    validationNote;
};
exports.RequestedMedication = RequestedMedication;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], RequestedMedication.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], RequestedMedication.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], RequestedMedication.prototype, "dosage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 1 }),
    __metadata("design:type", Number)
], RequestedMedication.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'unités' }),
    __metadata("design:type", String)
], RequestedMedication.prototype, "unit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], RequestedMedication.prototype, "isValidated", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], RequestedMedication.prototype, "validationNote", void 0);
exports.RequestedMedication = RequestedMedication = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], RequestedMedication);
let MedicationRequest = class MedicationRequest extends mongoose_2.Document {
    pharmacyId;
    patient;
    medications;
    status;
    requestDate;
    isUrgent;
    requestsDelivery;
    prescriptionImageUrl;
    doctorName;
    validationNote;
    deliveryConfirmedAt;
};
exports.MedicationRequest = MedicationRequest;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MedicationRequest.prototype, "pharmacyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Patient, required: true }),
    __metadata("design:type", Patient)
], MedicationRequest.prototype, "patient", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [RequestedMedication], required: true }),
    __metadata("design:type", Array)
], MedicationRequest.prototype, "medications", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: RequestStatus, default: RequestStatus.EN_ATTENTE }),
    __metadata("design:type", String)
], MedicationRequest.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], MedicationRequest.prototype, "requestDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], MedicationRequest.prototype, "isUrgent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], MedicationRequest.prototype, "requestsDelivery", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicationRequest.prototype, "prescriptionImageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicationRequest.prototype, "doctorName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicationRequest.prototype, "validationNote", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], MedicationRequest.prototype, "deliveryConfirmedAt", void 0);
exports.MedicationRequest = MedicationRequest = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MedicationRequest);
exports.MedicationRequestSchema = mongoose_1.SchemaFactory.createForClass(MedicationRequest);
//# sourceMappingURL=medication-request.schema.js.map