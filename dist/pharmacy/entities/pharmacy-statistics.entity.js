"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PharmacyStatistics = exports.TopMedication = exports.CategoryDistribution = exports.CategoryData = exports.DeliveryTrends = exports.TrendDataPoint = exports.SalesOverview = void 0;
class SalesOverview {
    totalSales;
    currency;
    totalDeliveries;
    percentageChange;
}
exports.SalesOverview = SalesOverview;
class TrendDataPoint {
    date;
    value;
}
exports.TrendDataPoint = TrendDataPoint;
class DeliveryTrends {
    dataPoints;
    period;
}
exports.DeliveryTrends = DeliveryTrends;
class CategoryData {
    name;
    percentage;
    color;
}
exports.CategoryData = CategoryData;
class CategoryDistribution {
    categories;
}
exports.CategoryDistribution = CategoryDistribution;
class TopMedication {
    id;
    name;
    dosage;
    requestCount;
    period;
    changePercentage;
    pricePerUnit;
}
exports.TopMedication = TopMedication;
class PharmacyStatistics {
    salesOverview;
    deliveryTrends;
    categoryDistribution;
    topMedications;
}
exports.PharmacyStatistics = PharmacyStatistics;
//# sourceMappingURL=pharmacy-statistics.entity.js.map