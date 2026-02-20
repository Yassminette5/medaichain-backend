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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const doctor_profile_schema_1 = require("./schemas/doctor-profile.schema");
const patient_profile_schema_1 = require("./schemas/patient-profile.schema");
const pharmacy_profile_schema_1 = require("./schemas/pharmacy-profile.schema");
const lab_profile_schema_1 = require("./schemas/lab-profile.schema");
const clinic_profile_schema_1 = require("./schemas/clinic-profile.schema");
const users_service_1 = require("../users/users.service");
const user_schema_1 = require("../users/schemas/user.schema");
let ProfilesService = class ProfilesService {
    constructor(doctorModel, patientModel, pharmacyModel, labModel, clinicModel, usersService) {
        this.doctorModel = doctorModel;
        this.patientModel = patientModel;
        this.pharmacyModel = pharmacyModel;
        this.labModel = labModel;
        this.clinicModel = clinicModel;
        this.usersService = usersService;
    }
    async getProfile(userId, role) {
        console.log(`[ProfilesService] Fetching profile for userId: ${userId}, role: ${role}`);
        const objectId = new mongoose_2.Types.ObjectId(userId);
        switch (role) {
            case user_schema_1.UserRole.MEDECIN:
                return this.doctorModel.findOne({ userId: objectId }).exec();
            case user_schema_1.UserRole.PATIENT:
                const patientProfile = await this.patientModel.findOne({ userId: objectId }).exec();
                console.log(`[ProfilesService] Patient profile found: ${!!patientProfile}`);
                return patientProfile;
            case user_schema_1.UserRole.PHARMACIE:
                return this.pharmacyModel.findOne({ userId: objectId }).exec();
            case user_schema_1.UserRole.CENTRE_ANALYSE:
                return this.labModel.findOne({ userId: objectId }).exec();
            case user_schema_1.UserRole.CLINIQUE:
                return this.clinicModel.findOne({ userId: objectId }).exec();
            default:
                throw new common_1.BadRequestException('Rôle invalide');
        }
    }
    async upsertDoctorProfile(userId, data) {
        const objectId = new mongoose_2.Types.ObjectId(userId);
        const profile = await this.doctorModel.findOneAndUpdate({ userId: objectId }, { ...data, userId: objectId }, { upsert: true, new: true }).exec();
        await this.usersService.markProfileCompleted(userId);
        return profile;
    }
    async upsertPatientProfile(userId, data) {
        const objectId = new mongoose_2.Types.ObjectId(userId);
        const profile = await this.patientModel.findOneAndUpdate({ userId: objectId }, { ...data, userId: objectId }, { upsert: true, new: true }).exec();
        await this.usersService.markProfileCompleted(userId);
        return profile;
    }
    async upsertPharmacyProfile(userId, data) {
        const objectId = new mongoose_2.Types.ObjectId(userId);
        const profile = await this.pharmacyModel.findOneAndUpdate({ userId: objectId }, { ...data, userId: objectId }, { upsert: true, new: true }).exec();
        await this.usersService.markProfileCompleted(userId);
        return profile;
    }
    async upsertLabProfile(userId, data) {
        const objectId = new mongoose_2.Types.ObjectId(userId);
        const profile = await this.labModel.findOneAndUpdate({ userId: objectId }, { ...data, userId: objectId }, { upsert: true, new: true }).exec();
        await this.usersService.markProfileCompleted(userId);
        return profile;
    }
    async upsertClinicProfile(userId, data) {
        const objectId = new mongoose_2.Types.ObjectId(userId);
        const profile = await this.clinicModel.findOneAndUpdate({ userId: objectId }, { ...data, userId: objectId }, { upsert: true, new: true }).exec();
        await this.usersService.markProfileCompleted(userId);
        return profile;
    }
    async searchDoctors(filters) {
        const query = { isVerified: true };
        if (filters.speciality)
            query.speciality = new RegExp(filters.speciality, 'i');
        if (filters.city)
            query.city = new RegExp(filters.city, 'i');
        if (filters.wilaya)
            query.wilaya = new RegExp(filters.wilaya, 'i');
        return this.doctorModel.find(query).exec();
    }
    async searchPharmacies(filters) {
        const query = { isVerified: true };
        if (filters.city)
            query.city = new RegExp(filters.city, 'i');
        if (filters.wilaya)
            query.wilaya = new RegExp(filters.wilaya, 'i');
        if (filters.is24Hours)
            query.is24Hours = true;
        if (filters.hasDelivery)
            query.hasDelivery = true;
        return this.pharmacyModel.find(query).exec();
    }
    async searchLabs(filters) {
        const query = { isVerified: true };
        if (filters.localisation)
            query.localisation = new RegExp(filters.localisation, 'i');
        if (filters.categorie)
            query.categorie = new RegExp(filters.categorie, 'i');
        return this.labModel.find(query).exec();
    }
};
exports.ProfilesService = ProfilesService;
exports.ProfilesService = ProfilesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(doctor_profile_schema_1.DoctorProfile.name)),
    __param(1, (0, mongoose_1.InjectModel)(patient_profile_schema_1.PatientProfile.name)),
    __param(2, (0, mongoose_1.InjectModel)(pharmacy_profile_schema_1.PharmacyProfile.name)),
    __param(3, (0, mongoose_1.InjectModel)(lab_profile_schema_1.LabProfile.name)),
    __param(4, (0, mongoose_1.InjectModel)(clinic_profile_schema_1.ClinicProfile.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        users_service_1.UsersService])
], ProfilesService);
//# sourceMappingURL=profiles.service.js.map