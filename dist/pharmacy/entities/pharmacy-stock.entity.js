"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockSettings = exports.MedicationStock = exports.StockLevel = void 0;
var StockLevel;
(function (StockLevel) {
    StockLevel["CRITICAL"] = "critical";
    StockLevel["ALERT"] = "alert";
    StockLevel["NORMAL"] = "normal";
})(StockLevel || (exports.StockLevel = StockLevel = {}));
class MedicationStock {
    id;
    pharmacyId;
    name;
    dosage;
    currentStock;
    maxStock;
    unit;
    stockLevel;
    createdAt;
    updatedAt;
    constructor(partial) {
        Object.assign(this, partial);
        this.stockLevel = this.calculateStockLevel();
    }
    calculateStockLevel() {
        const percentage = (this.currentStock / this.maxStock) * 100;
        if (percentage <= 8)
            return StockLevel.CRITICAL;
        if (percentage <= 12)
            return StockLevel.ALERT;
        return StockLevel.NORMAL;
    }
}
exports.MedicationStock = MedicationStock;
class StockSettings {
    pharmacyId;
    pushNotificationsEnabled;
    weeklyReportsEnabled;
    criticalStockThreshold;
    alertStockThreshold;
}
exports.StockSettings = StockSettings;
//# sourceMappingURL=pharmacy-stock.entity.js.map