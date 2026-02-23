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
exports.AdmissionSchema = exports.Admission = exports.AdmissionStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var AdmissionStatus;
(function (AdmissionStatus) {
    AdmissionStatus["WAITING"] = "waiting";
    AdmissionStatus["IN_CONSULTATION"] = "in_consultation";
    AdmissionStatus["COMPLETED"] = "completed";
    AdmissionStatus["CANCELLED"] = "cancelled";
})(AdmissionStatus || (exports.AdmissionStatus = AdmissionStatus = {}));
let Admission = class Admission {
    clinicId;
    patientId;
    doctorId;
    patientName;
    patientPhone;
    reason;
    date;
    status;
    queueNumber;
    notes;
};
exports.Admission = Admission;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Clinic', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Admission.prototype, "clinicId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Admission.prototype, "patientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Admission.prototype, "doctorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Admission.prototype, "patientName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Admission.prototype, "patientPhone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Admission.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Admission.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: AdmissionStatus, default: AdmissionStatus.WAITING }),
    __metadata("design:type", String)
], Admission.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Admission.prototype, "queueNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Admission.prototype, "notes", void 0);
exports.Admission = Admission = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Admission);
exports.AdmissionSchema = mongoose_1.SchemaFactory.createForClass(Admission);
//# sourceMappingURL=admission.schema.js.map