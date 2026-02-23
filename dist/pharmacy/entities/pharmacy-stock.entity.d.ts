export declare enum StockLevel {
    CRITICAL = "critical",
    ALERT = "alert",
    NORMAL = "normal"
}
export declare class MedicationStock {
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
    constructor(partial: Partial<MedicationStock>);
    private calculateStockLevel;
}
export declare class StockSettings {
    pharmacyId: string;
    pushNotificationsEnabled: boolean;
    weeklyReportsEnabled: boolean;
    criticalStockThreshold: number;
    alertStockThreshold: number;
}
