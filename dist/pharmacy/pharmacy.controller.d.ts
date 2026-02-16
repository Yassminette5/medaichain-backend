import { PharmacyStockService } from './pharmacy-stock.service';
import { PharmacyStatisticsService } from './pharmacy-statistics.service';
import { MedicationRequestService } from './medication-request.service';
import { CreateStockDto, UpdateStockDto, UpdateStockSettingsDto } from './dto/create-stock.dto';
import { CreateMedicationRequestDto, UpdateMedicationRequestDto } from './dto/create-medication-request.dto';
import { RequestStatus } from './schemas/medication-request.schema';
export declare class PharmacyController {
    private readonly stockService;
    private readonly statisticsService;
    private readonly requestService;
    constructor(stockService: PharmacyStockService, statisticsService: PharmacyStatisticsService, requestService: MedicationRequestService);
    getDashboard(pharmacyId: string): Promise<{
        pharmacyInfo: {
            id: string;
            name: string;
            totalOrders: number;
            totalPackages: number;
        };
        medicationRequests: (import("mongoose").Document<unknown, {}, import("./schemas/medication-request.schema").MedicationRequest, {}, {}> & import("./schemas/medication-request.schema").MedicationRequest & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    getStock(pharmacyId: string): Promise<{
        settings: import("mongoose").Document<unknown, {}, import("./schemas/medication-stock.schema").StockSettings, {}, {}> & import("./schemas/medication-stock.schema").StockSettings & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
        medications: (import("mongoose").Document<unknown, {}, import("./schemas/medication-stock.schema").MedicationStock, {}, {}> & import("./schemas/medication-stock.schema").MedicationStock & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    createStock(pharmacyId: string, createStockDto: CreateStockDto): Promise<import("./schemas/medication-stock.schema").MedicationStock>;
    updateStock(pharmacyId: string, stockId: string, updateStockDto: UpdateStockDto): Promise<import("./schemas/medication-stock.schema").MedicationStock>;
    deleteStock(pharmacyId: string, stockId: string): Promise<{
        message: string;
    }>;
    getStockSettings(pharmacyId: string): Promise<import("./schemas/medication-stock.schema").StockSettings>;
    updateStockSettings(pharmacyId: string, updateDto: UpdateStockSettingsDto): Promise<import("./schemas/medication-stock.schema").StockSettings>;
    getStatistics(pharmacyId: string): Promise<import("./entities/pharmacy-statistics.entity").PharmacyStatistics>;
    getRequests(pharmacyId: string, status?: RequestStatus): Promise<import("./schemas/medication-request.schema").MedicationRequest[]>;
    getRequest(pharmacyId: string, requestId: string): Promise<import("./schemas/medication-request.schema").MedicationRequest>;
    createRequest(pharmacyId: string, createDto: CreateMedicationRequestDto): Promise<import("./schemas/medication-request.schema").MedicationRequest>;
    updateRequest(pharmacyId: string, requestId: string, updateDto: UpdateMedicationRequestDto): Promise<import("./schemas/medication-request.schema").MedicationRequest>;
    deleteRequest(pharmacyId: string, requestId: string): Promise<{
        message: string;
    }>;
    getAllPharmacies(): Promise<{
        pharmacyId: string;
    }[]>;
    getAvailableMedications(pharmacyId: string): Promise<{
        id: string;
        name: string;
        dosage: string;
        unit: string;
    }[]>;
}
