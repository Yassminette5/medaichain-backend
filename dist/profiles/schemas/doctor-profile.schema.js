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
exports.DoctorProfileSchema = exports.DoctorProfile = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let DoctorProfile = class DoctorProfile {
    userId;
    fullName;
    speciality;
    subSpeciality;
    licenseNumber;
    hospital;
    clinicAddress;
    city;
    wilaya;
    yearsOfExperience;
    consultationFee;
    languages;
    workingDays;
    workingHoursStart;
    workingHoursEnd;
    bio;
    profilePhoto;
    isVerified;
    verifiedAt;
};
exports.DoctorProfile = DoctorProfile;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, unique: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], DoctorProfile.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], DoctorProfile.prototype, "fullName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DoctorProfile.prototype, "speciality", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DoctorProfile.prototype, "subSpeciality", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DoctorProfile.prototype, "licenseNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DoctorProfile.prototype, "hospital", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DoctorProfile.prototype, "clinicAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DoctorProfile.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DoctorProfile.prototype, "wilaya", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], DoctorProfile.prototype, "yearsOfExperience", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], DoctorProfile.prototype, "consultationFee", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], DoctorProfile.prototype, "languages", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], DoctorProfile.prototype, "workingDays", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DoctorProfile.prototype, "workingHoursStart", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DoctorProfile.prototype, "workingHoursEnd", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DoctorProfile.prototype, "bio", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DoctorProfile.prototype, "profilePhoto", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], DoctorProfile.prototype, "isVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], DoctorProfile.prototype, "verifiedAt", void 0);
exports.DoctorProfile = DoctorProfile = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], DoctorProfile);
exports.DoctorProfileSchema = mongoose_1.SchemaFactory.createForClass(DoctorProfile);
//# sourceMappingURL=doctor-profile.schema.js.map