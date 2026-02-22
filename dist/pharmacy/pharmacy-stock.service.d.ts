import { Model } from 'mongoose';
import { MedicationStock, StockSettings } from './schemas/medication-stock.schema';
import { CreateStockDto, UpdateStockDto, UpdateStockSettingsDto } from './dto/create-stock.dto';
export declare class PharmacyStockService {
    private medicationStockModel;
    private stockSettingsModel;
    constructor(medicationStockModel: Model<MedicationStock>, stockSettingsModel: Model<StockSettings>);
    getStockByPharmacy(pharmacyId: string): Promise<{
        settings: import("mongoose").Document<unknown, {}, StockSettings, {}, {}> & StockSettings & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
        medications: (import("mongoose").Document<unknown, {}, MedicationStock, {}, {}> & MedicationStock & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    createStock(pharmacyId: string, createStockDto: CreateStockDto): Promise<MedicationStock>;
    updateStock(pharmacyId: string, stockId: string, updateStockDto: UpdateStockDto): Promise<MedicationStock>;
    deleteStock(pharmacyId: string, stockId: string): Promise<void>;
    getSettings(pharmacyId: string): Promise<StockSettings>;
    updateSettings(pharmacyId: string, updateDto: UpdateStockSettingsDto): Promise<StockSettings>;
    private getDefaultSettings;
    getAllPharmacies(): Promise<{
        pharmacyId: string;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        offersDelivery: boolean;
    }[]>;
    getAvailableMedications(pharmacyId: string): Promise<{
        id: string;
        name: string;
        dosage: string;
        unit: string;
    }[]>;
}
