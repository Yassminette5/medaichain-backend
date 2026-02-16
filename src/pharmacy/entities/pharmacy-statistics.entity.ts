export class SalesOverview {
  totalSales: number;
  currency: string;
  totalDeliveries: number;
  percentageChange: number;
}

export class TrendDataPoint {
  date: Date;
  value: number;
}

export class DeliveryTrends {
  dataPoints: TrendDataPoint[];
  period: string;
}

export class CategoryData {
  name: string;
  percentage: number;
  color: string;
}

export class CategoryDistribution {
  categories: CategoryData[];
}

export class TopMedication {
  id: string;
  name: string;
  dosage: string;
  requestCount: number;
  period: string;
  changePercentage: number;
  pricePerUnit: number;
}

export class PharmacyStatistics {
  salesOverview: SalesOverview;
  deliveryTrends: DeliveryTrends;
  categoryDistribution: CategoryDistribution;
  topMedications: TopMedication[];
}
