export declare class CreateStockDto {
    name: string;
    dosage: string;
    currentStock: number;
    maxStock: number;
    unit?: string;
}
export declare class UpdateStockDto {
    currentStock?: number;
    maxStock?: number;
}
export declare class UpdateStockSettingsDto {
    pushNotificationsEnabled?: boolean;
    weeklyReportsEnabled?: boolean;
    criticalStockThreshold?: number;
    alertStockThreshold?: number;
}
