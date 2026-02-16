export enum StockLevel {
  CRITICAL = 'critical',
  ALERT = 'alert',
  NORMAL = 'normal',
}

export class MedicationStock {
  id: string;
  pharmacyId: string;
  name: string;
  dosage: string;
  currentStock: number;
  maxStock: number;
  unit: string;
  stockLevel: StockLevel;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<MedicationStock>) {
    Object.assign(this, partial);
    this.stockLevel = this.calculateStockLevel();
  }

  private calculateStockLevel(): StockLevel {
    const percentage = (this.currentStock / this.maxStock) * 100;
    if (percentage <= 8) return StockLevel.CRITICAL;
    if (percentage <= 12) return StockLevel.ALERT;
    return StockLevel.NORMAL;
  }
}

export class StockSettings {
  pharmacyId: string;
  pushNotificationsEnabled: boolean;
  weeklyReportsEnabled: boolean;
  criticalStockThreshold: number;
  alertStockThreshold: number;
}
