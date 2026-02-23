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
exports.PatientInformationSchema = exports.PatientInformation = exports.Gender = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var Gender;
(function (Gender) {
    Gender["MALE"] = "male";
    Gender["FEMALE"] = "female";
})(Gender || (exports.Gender = Gender = {}));
let PatientInformation = class PatientInformation {
    userId;
    fullName;
    age;
    gender;
    allergies;
    height;
    weight;
};
exports.PatientInformation = PatientInformation;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, unique: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PatientInformation.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PatientInformation.prototype, "fullName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], PatientInformation.prototype, "age", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: Gender, default: undefined }),
    __metadata("design:type", String)
], PatientInformation.prototype, "gender", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], PatientInformation.prototype, "allergies", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], PatientInformation.prototype, "height", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], PatientInformation.prototype, "weight", void 0);
exports.PatientInformation = PatientInformation = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PatientInformation);
exports.PatientInformationSchema = mongoose_1.SchemaFactory.createForClass(PatientInformation);
//# sourceMappingURL=patient_information.schema.js.map