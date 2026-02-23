"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PharmacyModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const pharmacy_controller_1 = require("./pharmacy.controller");
const pharmacy_stock_service_1 = require("./pharmacy-stock.service");
const pharmacy_statistics_service_1 = require("./pharmacy-statistics.service");
const medication_request_service_1 = require("./medication-request.service");
const medication_stock_schema_1 = require("./schemas/medication-stock.schema");
const medication_request_schema_1 = require("./schemas/medication-request.schema");
let PharmacyModule = class PharmacyModule {
};
exports.PharmacyModule = PharmacyModule;
exports.PharmacyModule = PharmacyModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: medication_stock_schema_1.MedicationStock.name, schema: medication_stock_schema_1.MedicationStockSchema },
                { name: medication_stock_schema_1.StockSettings.name, schema: medication_stock_schema_1.StockSettingsSchema },
                { name: medication_request_schema_1.MedicationRequest.name, schema: medication_request_schema_1.MedicationRequestSchema },
            ]),
        ],
        controllers: [pharmacy_controller_1.PharmacyController],
        providers: [
            pharmacy_stock_service_1.PharmacyStockService,
            pharmacy_statistics_service_1.PharmacyStatisticsService,
            medication_request_service_1.MedicationRequestService,
        ],
        exports: [
            pharmacy_stock_service_1.PharmacyStockService,
            pharmacy_statistics_service_1.PharmacyStatisticsService,
            medication_request_service_1.MedicationRequestService,
        ],
    })
], PharmacyModule);
//# sourceMappingURL=pharmacy.module.js.map