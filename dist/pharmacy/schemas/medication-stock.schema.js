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
exports.StockSettingsSchema = exports.StockSettings = exports.MedicationStockSchema = exports.MedicationStock = exports.StockLevel = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var StockLevel;
(function (StockLevel) {
    StockLevel["CRITICAL"] = "critical";
    StockLevel["ALERT"] = "alert";
    StockLevel["NORMAL"] = "normal";
})(StockLevel || (exports.StockLevel = StockLevel = {}));
let MedicationStock = class MedicationStock extends mongoose_2.Document {
    pharmacyId;
    name;
    dosage;
    currentStock;
    maxStock;
    unit;
    stockLevel;
};
exports.MedicationStock = MedicationStock;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MedicationStock.prototype, "pharmacyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MedicationStock.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MedicationStock.prototype, "dosage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], MedicationStock.prototype, "currentStock", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 1 }),
    __metadata("design:type", Number)
], MedicationStock.prototype, "maxStock", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'unités' }),
    __metadata("design:type", String)
], MedicationStock.prototype, "unit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: StockLevel }),
    __metadata("design:type", String)
], MedicationStock.prototype, "stockLevel", void 0);
exports.MedicationStock = MedicationStock = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MedicationStock);
exports.MedicationStockSchema = mongoose_1.SchemaFactory.createForClass(MedicationStock);
exports.MedicationStockSchema.pre('save', function (next) {
    const percentage = (this.currentStock / this.maxStock) * 100;
    if (percentage <= 8) {
        this.stockLevel = StockLevel.CRITICAL;
    }
    else if (percentage <= 12) {
        this.stockLevel = StockLevel.ALERT;
    }
    else {
        this.stockLevel = StockLevel.NORMAL;
    }
    next();
});
let StockSettings = class StockSettings extends mongoose_2.Document {
    pharmacyId;
    pushNotificationsEnabled;
    weeklyReportsEnabled;
    criticalStockThreshold;
    alertStockThreshold;
};
exports.StockSettings = StockSettings;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], StockSettings.prototype, "pharmacyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], StockSettings.prototype, "pushNotificationsEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], StockSettings.prototype, "weeklyReportsEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 8, min: 1 }),
    __metadata("design:type", Number)
], StockSettings.prototype, "criticalStockThreshold", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 12, min: 1 }),
    __metadata("design:type", Number)
], StockSettings.prototype, "alertStockThreshold", void 0);
exports.StockSettings = StockSettings = __decorate([
    (0, mongoose_1.Schema)()
], StockSettings);
exports.StockSettingsSchema = mongoose_1.SchemaFactory.createForClass(StockSettings);
//# sourceMappingURL=medication-stock.schema.js.map