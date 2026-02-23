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
exports.ClinicDoctorSchema = exports.ClinicDoctor = exports.DoctorStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var DoctorStatus;
(function (DoctorStatus) {
    DoctorStatus["ACTIVE"] = "active";
    DoctorStatus["INACTIVE"] = "inactive";
    DoctorStatus["PENDING"] = "pending";
})(DoctorStatus || (exports.DoctorStatus = DoctorStatus = {}));
let ClinicDoctor = class ClinicDoctor {
    clinicId;
    doctorId;
    fullName;
    speciality;
    phone;
    email;
    workingDays;
    workingHoursStart;
    workingHoursEnd;
    consultationFee;
    status;
};
exports.ClinicDoctor = ClinicDoctor;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Clinic', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ClinicDoctor.prototype, "clinicId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ClinicDoctor.prototype, "doctorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ClinicDoctor.prototype, "fullName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ClinicDoctor.prototype, "speciality", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ClinicDoctor.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ClinicDoctor.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], ClinicDoctor.prototype, "workingDays", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ClinicDoctor.prototype, "workingHoursStart", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ClinicDoctor.prototype, "workingHoursEnd", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ClinicDoctor.prototype, "consultationFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: DoctorStatus, default: DoctorStatus.ACTIVE }),
    __metadata("design:type", String)
], ClinicDoctor.prototype, "status", void 0);
exports.ClinicDoctor = ClinicDoctor = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ClinicDoctor);
exports.ClinicDoctorSchema = mongoose_1.SchemaFactory.createForClass(ClinicDoctor);
//# sourceMappingURL=clinic-doctor.schema.js.map