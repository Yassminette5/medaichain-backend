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
exports.ProfilesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const profiles_service_1 = require("./profiles.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_schema_1 = require("../users/schemas/user.schema");
const auth_service_1 = require("../auth/auth.service");
let ProfilesController = class ProfilesController {
    constructor(profilesService, authService) {
        this.profilesService = profilesService;
        this.authService = authService;
    }
    async getMyProfile(req) {
        return this.profilesService.getProfile(req.user.userId, req.user.role);
    }
    async updateDoctorProfile(req, data) {
        await this.profilesService.upsertDoctorProfile(req.user.userId, data);
        return this.authService.getProfile(req.user.userId);
    }
    async updatePatientInformation(req, data) {
        await this.profilesService.upsertPatientInformation(req.user.userId, data);
        return this.authService.getProfile(req.user.userId);
    }
    async updatePharmacyProfile(req, data) {
        return this.profilesService.upsertPharmacyProfile(req.user.userId, data);
    }
    async updateLabProfile(req, data) {
        return this.profilesService.upsertLabProfile(req.user.userId, data);
    }
    async updateClinicProfile(req, data) {
        return this.profilesService.upsertClinicProfile(req.user.userId, data);
    }
    async searchDoctors(speciality, city, wilaya) {
        return this.profilesService.searchDoctors({ speciality, city, wilaya });
    }
    async searchPharmacies(city, wilaya, is24Hours, hasDelivery) {
        return this.profilesService.searchPharmacies({ city, wilaya, is24Hours, hasDelivery });
    }
    async searchLabs(localisation, categorie) {
        return this.profilesService.searchLabs({ localisation, categorie });
    }
    async getMySummaryUrl(req) {
        return this.profilesService.getSummaryUrl(req.user.userId);
    }
};
exports.ProfilesController = ProfilesController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtenir mon profil selon mon rôle' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.MEDECIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Put)('doctor'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer/Mettre à jour mon profil médecin' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "updateDoctorProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.PATIENT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Put)('patient'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer/Mettre à jour mon profil patient' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "updatePatientInformation", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.PHARMACIE),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Put)('pharmacy'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer/Mettre à jour mon profil pharmacie' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "updatePharmacyProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.CENTRE_ANALYSE),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Put)('lab'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer/Mettre à jour mon profil laboratoire' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "updateLabProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.CLINIQUE),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Put)('clinic'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer/Mettre à jour mon profil clinique' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "updateClinicProfile", null);
__decorate([
    (0, common_1.Get)('doctors/search'),
    (0, swagger_1.ApiOperation)({ summary: 'Rechercher des médecins' }),
    (0, swagger_1.ApiQuery)({ name: 'speciality', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'wilaya', required: false }),
    __param(0, (0, common_1.Query)('speciality')),
    __param(1, (0, common_1.Query)('city')),
    __param(2, (0, common_1.Query)('wilaya')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "searchDoctors", null);
__decorate([
    (0, common_1.Get)('pharmacies/search'),
    (0, swagger_1.ApiOperation)({ summary: 'Rechercher des pharmacies' }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'wilaya', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'is24Hours', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'hasDelivery', required: false }),
    __param(0, (0, common_1.Query)('city')),
    __param(1, (0, common_1.Query)('wilaya')),
    __param(2, (0, common_1.Query)('is24Hours')),
    __param(3, (0, common_1.Query)('hasDelivery')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean, Boolean]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "searchPharmacies", null);
__decorate([
    (0, common_1.Get)('labs/search'),
    (0, swagger_1.ApiOperation)({ summary: 'Rechercher des laboratoires / centres d\'analyse' }),
    (0, swagger_1.ApiQuery)({ name: 'localisation', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'categorie', required: false }),
    __param(0, (0, common_1.Query)('localisation')),
    __param(1, (0, common_1.Query)('categorie')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "searchLabs", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('me/summary-url'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtenir l\'URL du résumé médical pour le QR Code' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "getMySummaryUrl", null);
exports.ProfilesController = ProfilesController = __decorate([
    (0, swagger_1.ApiTags)('Profils'),
    (0, common_1.Controller)('profiles'),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => auth_service_1.AuthService))),
    __metadata("design:paramtypes", [profiles_service_1.ProfilesService,
        auth_service_1.AuthService])
], ProfilesController);
//# sourceMappingURL=profiles.controller.js.map