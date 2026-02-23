export declare class SalesOverview {
    totalSales: number;
    currency: string;
    totalDeliveries: number;
    percentageChange: number;
}
export declare class TrendDataPoint {
    date: Date;
    value: number;
}
export declare class DeliveryTrends {
    dataPoints: TrendDataPoint[];
    period: string;
}
export declare class CategoryData {
    name: string;
    percentage: number;
    color: string;
}
export declare class CategoryDistribution {
    categories: CategoryData[];
}
export declare class TopMedication {
    id: string;
    name: string;
    dosage: string;
    requestCount: number;
    period: string;
    changePercentage: number;
    pricePerUnit: number;
}
export declare class PharmacyStatistics {
    salesOverview: SalesOverview;
    deliveryTrends: DeliveryTrends;
    categoryDistribution: CategoryDistribution;
    topMedications: TopMedication[];
}
