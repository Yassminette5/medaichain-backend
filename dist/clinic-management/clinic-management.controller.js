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
exports.ClinicManagementController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const clinic_management_service_1 = require("./clinic-management.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const clinic_dto_1 = require("./dto/clinic.dto");
const clinic_doctor_dto_1 = require("./dto/clinic-doctor.dto");
const appointment_dto_1 = require("./dto/appointment.dto");
const admission_dto_1 = require("./dto/admission.dto");
const medical_record_dto_1 = require("./dto/medical-record.dto");
const invoice_dto_1 = require("./dto/invoice.dto");
let ClinicManagementController = class ClinicManagementController {
    service;
    constructor(service) {
        this.service = service;
    }
    async createClinic(req, dto) {
        return this.service.createClinic(req.user.sub, dto);
    }
    async getMyClinic(req) {
        return this.service.getClinicByOwner(req.user.sub);
    }
    async getClinicById(id) {
        return this.service.getClinicById(id);
    }
    async updateClinic(id, dto) {
        return this.service.updateClinic(id, dto);
    }
    async deleteClinic(id) {
        return this.service.deleteClinic(id);
    }
    async getAvailableDoctors() {
        return this.service.getAvailableDoctors();
    }
    async addDoctor(clinicId, dto) {
        return this.service.addDoctorToClinic(clinicId, dto);
    }
    async getDoctors(clinicId) {
        return this.service.getDoctorsByClinic(clinicId);
    }
    async updateDoctor(id, dto) {
        return this.service.updateClinicDoctor(id, dto);
    }
    async removeDoctor(id) {
        return this.service.removeDoctorFromClinic(id);
    }
    async createAppointment(clinicId, dto) {
        return this.service.createAppointment(clinicId, dto);
    }
    async getAppointments(clinicId, date, status, doctorId) {
        return this.service.getAppointmentsByClinic(clinicId, { date, status, doctorId });
    }
    async getAppointment(id) {
        return this.service.getAppointmentById(id);
    }
    async updateAppointment(id, dto) {
        return this.service.updateAppointment(id, dto);
    }
    async deleteAppointment(id) {
        return this.service.deleteAppointment(id);
    }
    async createAdmission(clinicId, dto) {
        return this.service.createAdmission(clinicId, dto);
    }
    async getAdmissions(clinicId, date, status) {
        return this.service.getAdmissionsByClinic(clinicId, { date, status });
    }
    async updateAdmission(id, dto) {
        return this.service.updateAdmission(id, dto);
    }
    async deleteAdmission(id) {
        return this.service.deleteAdmission(id);
    }
    async createMedicalRecord(clinicId, dto) {
        return this.service.createMedicalRecord(clinicId, dto);
    }
    async getMedicalRecords(clinicId, patientId, doctorId, type) {
        return this.service.getMedicalRecordsByClinic(clinicId, { patientId, doctorId, type });
    }
    async getMedicalRecord(id) {
        return this.service.getMedicalRecordById(id);
    }
    async getPatientHistory(patientId) {
        return this.service.getPatientMedicalHistory(patientId);
    }
    async updateMedicalRecord(id, dto) {
        return this.service.updateMedicalRecord(id, dto);
    }
    async deleteMedicalRecord(id) {
        return this.service.deleteMedicalRecord(id);
    }
    async createInvoice(clinicId, dto) {
        return this.service.createInvoice(clinicId, dto);
    }
    async getInvoices(clinicId, paymentStatus, patientId, startDate, endDate) {
        return this.service.getInvoicesByClinic(clinicId, { paymentStatus, patientId, startDate, endDate });
    }
    async getInvoice(id) {
        return this.service.getInvoiceById(id);
    }
    async updateInvoice(id, dto) {
        return this.service.updateInvoice(id, dto);
    }
    async deleteInvoice(id) {
        return this.service.deleteInvoice(id);
    }
    async getDashboard(clinicId) {
        return this.service.getDashboardStats(clinicId);
    }
};
exports.ClinicManagementController = ClinicManagementController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('clinic'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer une clinique' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, clinic_dto_1.CreateClinicDto]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "createClinic", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('clinic/mine'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtenir ma clinique' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "getMyClinic", null);
__decorate([
    (0, common_1.Get)('clinic/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtenir une clinique par ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "getClinicById", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Put)('clinic/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour une clinique' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, clinic_dto_1.UpdateClinicDto]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "updateClinic", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)('clinic/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Supprimer une clinique' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "deleteClinic", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('doctors/available'),
    (0, swagger_1.ApiOperation)({ summary: 'Lister tous les médecins disponibles pour la clinique' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "getAvailableDoctors", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('clinic/:clinicId/doctors'),
    (0, swagger_1.ApiOperation)({ summary: 'Ajouter un médecin à la clinique' }),
    __param(0, (0, common_1.Param)('clinicId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, clinic_doctor_dto_1.AddDoctorToClinicDto]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "addDoctor", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('clinic/:clinicId/doctors'),
    (0, swagger_1.ApiOperation)({ summary: 'Lister les médecins de la clinique' }),
    __param(0, (0, common_1.Param)('clinicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "getDoctors", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Put)('doctors/:clinicDoctorId'),
    (0, swagger_1.ApiOperation)({ summary: 'Modifier un médecin dans la clinique' }),
    __param(0, (0, common_1.Param)('clinicDoctorId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, clinic_doctor_dto_1.UpdateClinicDoctorDto]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "updateDoctor", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)('doctors/:clinicDoctorId'),
    (0, swagger_1.ApiOperation)({ summary: 'Retirer un médecin de la clinique' }),
    __param(0, (0, common_1.Param)('clinicDoctorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "removeDoctor", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('clinic/:clinicId/appointments'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer un rendez-vous' }),
    __param(0, (0, common_1.Param)('clinicId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, appointment_dto_1.CreateAppointmentDto]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "createAppointment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('clinic/:clinicId/appointments'),
    (0, swagger_1.ApiOperation)({ summary: 'Lister les rendez-vous de la clinique' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, description: 'Filtrer par date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filtrer par statut' }),
    (0, swagger_1.ApiQuery)({ name: 'doctorId', required: false, description: 'Filtrer par médecin' }),
    __param(0, (0, common_1.Param)('clinicId')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('doctorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "getAppointments", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('appointments/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Détail d\'un rendez-vous' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "getAppointment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Put)('appointments/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Modifier un rendez-vous' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, appointment_dto_1.UpdateAppointmentDto]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "updateAppointment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)('appointments/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Supprimer un rendez-vous' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "deleteAppointment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('clinic/:clinicId/admissions'),
    (0, swagger_1.ApiOperation)({ summary: 'Admettre un patient (réception)' }),
    __param(0, (0, common_1.Param)('clinicId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admission_dto_1.CreateAdmissionDto]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "createAdmission", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('clinic/:clinicId/admissions'),
    (0, swagger_1.ApiOperation)({ summary: 'Lister les admissions du jour' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    __param(0, (0, common_1.Param)('clinicId')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "getAdmissions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Put)('admissions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Modifier une admission' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admission_dto_1.UpdateAdmissionDto]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "updateAdmission", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)('admissions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Supprimer une admission' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "deleteAdmission", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('clinic/:clinicId/medical-records'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer un dossier médical / consultation' }),
    __param(0, (0, common_1.Param)('clinicId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, medical_record_dto_1.CreateMedicalRecordDto]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "createMedicalRecord", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('clinic/:clinicId/medical-records'),
    (0, swagger_1.ApiOperation)({ summary: 'Lister les dossiers médicaux de la clinique' }),
    (0, swagger_1.ApiQuery)({ name: 'patientId', required: false, description: 'Filtrer par patient' }),
    (0, swagger_1.ApiQuery)({ name: 'doctorId', required: false, description: 'Filtrer par médecin' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'Filtrer par type (consultation, analyse, chirurgie, urgence, suivi, vaccination)' }),
    __param(0, (0, common_1.Param)('clinicId')),
    __param(1, (0, common_1.Query)('patientId')),
    __param(2, (0, common_1.Query)('doctorId')),
    __param(3, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "getMedicalRecords", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('medical-records/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Détail d\'un dossier médical' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "getMedicalRecord", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('patient/:patientId/medical-history'),
    (0, swagger_1.ApiOperation)({ summary: 'Historique médical complet d\'un patient (toutes cliniques)' }),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "getPatientHistory", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Put)('medical-records/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Modifier un dossier médical' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, medical_record_dto_1.UpdateMedicalRecordDto]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "updateMedicalRecord", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)('medical-records/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Supprimer un dossier médical' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "deleteMedicalRecord", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('clinic/:clinicId/invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer une facture' }),
    __param(0, (0, common_1.Param)('clinicId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, invoice_dto_1.CreateInvoiceDto]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "createInvoice", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('clinic/:clinicId/invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'Lister les factures de la clinique' }),
    (0, swagger_1.ApiQuery)({ name: 'paymentStatus', required: false, description: 'Filtrer par statut (pending, paid, partial)' }),
    (0, swagger_1.ApiQuery)({ name: 'patientId', required: false, description: 'Filtrer par patient' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Date début (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'Date fin (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Param)('clinicId')),
    __param(1, (0, common_1.Query)('paymentStatus')),
    __param(2, (0, common_1.Query)('patientId')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "getInvoices", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('invoices/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Détail d\'une facture' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Put)('invoices/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Modifier une facture / Enregistrer un paiement' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, invoice_dto_1.UpdateInvoiceDto]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "updateInvoice", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)('invoices/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Supprimer une facture' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "deleteInvoice", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('clinic/:clinicId/dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Tableau de bord professionnel avec KPIs, finances, analytics et activité récente' }),
    __param(0, (0, common_1.Param)('clinicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClinicManagementController.prototype, "getDashboard", null);
exports.ClinicManagementController = ClinicManagementController = __decorate([
    (0, swagger_1.ApiTags)('Gestion Clinique'),
    (0, common_1.Controller)('clinic-management'),
    __metadata("design:paramtypes", [clinic_management_service_1.ClinicManagementService])
], ClinicManagementController);
//# sourceMappingURL=clinic-management.controller.js.map