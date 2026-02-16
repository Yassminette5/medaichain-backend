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
exports.PharmacyController = void 0;
const common_1 = require("@nestjs/common");
const pharmacy_stock_service_1 = require("./pharmacy-stock.service");
const pharmacy_statistics_service_1 = require("./pharmacy-statistics.service");
const medication_request_service_1 = require("./medication-request.service");
const create_stock_dto_1 = require("./dto/create-stock.dto");
const create_medication_request_dto_1 = require("./dto/create-medication-request.dto");
const medication_request_schema_1 = require("./schemas/medication-request.schema");
let PharmacyController = class PharmacyController {
    constructor(stockService, statisticsService, requestService) {
        this.stockService = stockService;
        this.statisticsService = statisticsService;
        this.requestService = requestService;
    }
    async getDashboard(pharmacyId) {
        return this.requestService.getDashboard(pharmacyId);
    }
    async getStock(pharmacyId) {
        return this.stockService.getStockByPharmacy(pharmacyId);
    }
    async createStock(pharmacyId, createStockDto) {
        try {
            return await this.stockService.createStock(pharmacyId, createStockDto);
        }
        catch (error) {
            throw error;
        }
    }
    async updateStock(pharmacyId, stockId, updateStockDto) {
        return this.stockService.updateStock(pharmacyId, stockId, updateStockDto);
    }
    async deleteStock(pharmacyId, stockId) {
        await this.stockService.deleteStock(pharmacyId, stockId);
        return { message: 'Stock deleted successfully' };
    }
    async getStockSettings(pharmacyId) {
        return this.stockService.getSettings(pharmacyId);
    }
    async updateStockSettings(pharmacyId, updateDto) {
        return this.stockService.updateSettings(pharmacyId, updateDto);
    }
    async getStatistics(pharmacyId) {
        return this.statisticsService.getStatistics(pharmacyId);
    }
    async getRequests(pharmacyId, status) {
        return this.requestService.getRequestsByPharmacy(pharmacyId, status);
    }
    async getRequest(pharmacyId, requestId) {
        return this.requestService.getRequestById(pharmacyId, requestId);
    }
    async createRequest(pharmacyId, createDto) {
        return this.requestService.createRequest(pharmacyId, createDto);
    }
    async updateRequest(pharmacyId, requestId, updateDto) {
        return this.requestService.updateRequest(pharmacyId, requestId, updateDto);
    }
    async deleteRequest(pharmacyId, requestId) {
        await this.requestService.deleteRequest(pharmacyId, requestId);
        return { message: 'Request deleted successfully' };
    }
    async getAllPharmacies() {
        return this.stockService.getAllPharmacies();
    }
    async getAvailableMedications(pharmacyId) {
        return this.stockService.getAvailableMedications(pharmacyId);
    }
};
exports.PharmacyController = PharmacyController;
__decorate([
    (0, common_1.Get)(':pharmacyId/dashboard'),
    __param(0, (0, common_1.Param)('pharmacyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)(':pharmacyId/stock'),
    __param(0, (0, common_1.Param)('pharmacyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getStock", null);
__decorate([
    (0, common_1.Post)(':pharmacyId/stock'),
    __param(0, (0, common_1.Param)('pharmacyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_stock_dto_1.CreateStockDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "createStock", null);
__decorate([
    (0, common_1.Put)(':pharmacyId/stock/:stockId'),
    __param(0, (0, common_1.Param)('pharmacyId')),
    __param(1, (0, common_1.Param)('stockId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_stock_dto_1.UpdateStockDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "updateStock", null);
__decorate([
    (0, common_1.Delete)(':pharmacyId/stock/:stockId'),
    __param(0, (0, common_1.Param)('pharmacyId')),
    __param(1, (0, common_1.Param)('stockId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "deleteStock", null);
__decorate([
    (0, common_1.Get)(':pharmacyId/stock/settings'),
    __param(0, (0, common_1.Param)('pharmacyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getStockSettings", null);
__decorate([
    (0, common_1.Put)(':pharmacyId/stock/settings'),
    __param(0, (0, common_1.Param)('pharmacyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_stock_dto_1.UpdateStockSettingsDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "updateStockSettings", null);
__decorate([
    (0, common_1.Get)(':pharmacyId/statistics'),
    __param(0, (0, common_1.Param)('pharmacyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)(':pharmacyId/requests'),
    __param(0, (0, common_1.Param)('pharmacyId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getRequests", null);
__decorate([
    (0, common_1.Get)(':pharmacyId/requests/:requestId'),
    __param(0, (0, common_1.Param)('pharmacyId')),
    __param(1, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getRequest", null);
__decorate([
    (0, common_1.Post)(':pharmacyId/requests'),
    __param(0, (0, common_1.Param)('pharmacyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_medication_request_dto_1.CreateMedicationRequestDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Put)(':pharmacyId/requests/:requestId'),
    __param(0, (0, common_1.Param)('pharmacyId')),
    __param(1, (0, common_1.Param)('requestId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_medication_request_dto_1.UpdateMedicationRequestDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "updateRequest", null);
__decorate([
    (0, common_1.Delete)(':pharmacyId/requests/:requestId'),
    __param(0, (0, common_1.Param)('pharmacyId')),
    __param(1, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "deleteRequest", null);
__decorate([
    (0, common_1.Get)('list/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getAllPharmacies", null);
__decorate([
    (0, common_1.Get)(':pharmacyId/available-medications'),
    __param(0, (0, common_1.Param)('pharmacyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getAvailableMedications", null);
exports.PharmacyController = PharmacyController = __decorate([
    (0, common_1.Controller)('pharmacy'),
    __metadata("design:paramtypes", [pharmacy_stock_service_1.PharmacyStockService,
        pharmacy_statistics_service_1.PharmacyStatisticsService,
        medication_request_service_1.MedicationRequestService])
], PharmacyController);
//# sourceMappingURL=pharmacy.controller.js.map