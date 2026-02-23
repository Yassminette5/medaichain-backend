import { Document } from 'mongoose';
export declare enum StockLevel {
    CRITICAL = "critical",
    ALERT = "alert",
    NORMAL = "normal"
}
export declare class MedicationStock extends Document {
    pharmacyId: string;
    name: string;
    dosage: string;
    currentStock: number;
    maxStock: number;
    unit: string;
    price: number;
    stockLevel: StockLevel;
}
export declare const MedicationStockSchema: import("mongoose").Schema<MedicationStock, import("mongoose").Model<MedicationStock, any, any, any, Document<unknown, any, MedicationStock, any, {}> & MedicationStock & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MedicationStock, Document<unknown, {}, import("mongoose").FlatRecord<MedicationStock>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<MedicationStock> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare class StockSettings extends Document {
    pharmacyId: string;
    pushNotificationsEnabled: boolean;
    weeklyReportsEnabled: boolean;
    criticalStockThreshold: number;
    alertStockThreshold: number;
}
export declare const StockSettingsSchema: import("mongoose").Schema<StockSettings, import("mongoose").Model<StockSettings, any, any, any, Document<unknown, any, StockSettings, any, {}> & StockSettings & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StockSettings, Document<unknown, {}, import("mongoose").FlatRecord<StockSettings>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<StockSettings> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
