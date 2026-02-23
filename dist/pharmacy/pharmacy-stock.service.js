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
exports.PharmacyStockService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const medication_stock_schema_1 = require("./schemas/medication-stock.schema");
let PharmacyStockService = class PharmacyStockService {
    medicationStockModel;
    stockSettingsModel;
    constructor(medicationStockModel, stockSettingsModel) {
        this.medicationStockModel = medicationStockModel;
        this.stockSettingsModel = stockSettingsModel;
    }
    async getStockByPharmacy(pharmacyId) {
        const medications = await this.medicationStockModel.find({ pharmacyId }).exec();
        let settings = await this.stockSettingsModel.findOne({ pharmacyId }).exec();
        if (!settings) {
            settings = await this.stockSettingsModel.create(this.getDefaultSettings(pharmacyId));
        }
        return {
            settings,
            medications,
        };
    }
    async createStock(pharmacyId, createStockDto) {
        const newStock = await this.medicationStockModel.create({
            pharmacyId,
            ...createStockDto,
        });
        return newStock;
    }
    async updateStock(pharmacyId, stockId, updateStockDto) {
        const updatedStock = await this.medicationStockModel
            .findOneAndUpdate({ _id: stockId, pharmacyId }, updateStockDto, { new: true })
            .exec();
        if (!updatedStock) {
            throw new common_1.NotFoundException('Stock not found');
        }
        return updatedStock;
    }
    async deleteStock(pharmacyId, stockId) {
        const result = await this.medicationStockModel
            .deleteOne({ _id: stockId, pharmacyId })
            .exec();
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException('Stock not found');
        }
    }
    async getSettings(pharmacyId) {
        let settings = await this.stockSettingsModel.findOne({ pharmacyId }).exec();
        if (!settings) {
            settings = await this.stockSettingsModel.create(this.getDefaultSettings(pharmacyId));
        }
        return settings;
    }
    async updateSettings(pharmacyId, updateDto) {
        let settings = await this.stockSettingsModel
            .findOneAndUpdate({ pharmacyId }, updateDto, { new: true, upsert: true })
            .exec();
        return settings;
    }
    getDefaultSettings(pharmacyId) {
        return {
            pharmacyId,
            pushNotificationsEnabled: true,
            weeklyReportsEnabled: true,
            criticalStockThreshold: 8,
            alertStockThreshold: 12,
        };
    }
    async getAllPharmacies() {
        const pharmacyIds = await this.medicationStockModel
            .distinct('pharmacyId')
            .exec();
        return pharmacyIds.map((id, index) => ({
            pharmacyId: id,
            name: `Pharmacie ${index + 1}`,
            address: `${index + 1} Rue de la Pharmacie, Alger`,
            latitude: 36.7538 + (Math.random() - 0.5) * 0.1,
            longitude: 3.0588 + (Math.random() - 0.5) * 0.1,
            offersDelivery: index % 2 === 0,
        }));
    }
    async getAvailableMedications(pharmacyId) {
        const medications = await this.medicationStockModel
            .find({
            pharmacyId,
            currentStock: { $gt: 0 }
        })
            .select('name dosage unit')
            .exec();
        return medications.map(med => ({
            id: med._id.toString(),
            name: med.name,
            dosage: med.dosage,
            unit: med.unit,
        }));
    }
};
exports.PharmacyStockService = PharmacyStockService;
exports.PharmacyStockService = PharmacyStockService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(medication_stock_schema_1.MedicationStock.name)),
    __param(1, (0, mongoose_1.InjectModel)(medication_stock_schema_1.StockSettings.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], PharmacyStockService);
//# sourceMappingURL=pharmacy-stock.service.js.map