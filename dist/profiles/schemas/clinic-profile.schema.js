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
exports.ClinicProfileSchema = exports.ClinicProfile = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let ClinicProfile = class ClinicProfile {
    userId;
    clinicName;
    directorName;
    licenseNumber;
    registrationNumber;
    address;
    city;
    wilaya;
    postalCode;
    gpsLatitude;
    gpsLongitude;
    specialities;
    services;
    bedCount;
    hasEmergency;
    hasAmbulance;
    insuranceAccepted;
    workingDays;
    openingTime;
    closingTime;
    website;
    profilePhoto;
    photos;
    isVerified;
    verifiedAt;
};
exports.ClinicProfile = ClinicProfile;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, unique: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ClinicProfile.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ClinicProfile.prototype, "clinicName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ClinicProfile.prototype, "directorName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ClinicProfile.prototype, "licenseNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ClinicProfile.prototype, "registrationNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ClinicProfile.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ClinicProfile.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ClinicProfile.prototype, "wilaya", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ClinicProfile.prototype, "postalCode", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], ClinicProfile.prototype, "gpsLatitude", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], ClinicProfile.prototype, "gpsLongitude", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], ClinicProfile.prototype, "specialities", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], ClinicProfile.prototype, "services", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], ClinicProfile.prototype, "bedCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], ClinicProfile.prototype, "hasEmergency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], ClinicProfile.prototype, "hasAmbulance", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], ClinicProfile.prototype, "insuranceAccepted", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], ClinicProfile.prototype, "workingDays", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ClinicProfile.prototype, "openingTime", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ClinicProfile.prototype, "closingTime", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ClinicProfile.prototype, "website", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ClinicProfile.prototype, "profilePhoto", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], ClinicProfile.prototype, "photos", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], ClinicProfile.prototype, "isVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], ClinicProfile.prototype, "verifiedAt", void 0);
exports.ClinicProfile = ClinicProfile = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ClinicProfile);
exports.ClinicProfileSchema = mongoose_1.SchemaFactory.createForClass(ClinicProfile);
//# sourceMappingURL=clinic-profile.schema.js.map