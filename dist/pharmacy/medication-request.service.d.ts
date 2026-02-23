import { Model } from 'mongoose';
import { MedicationRequest, RequestStatus } from './schemas/medication-request.schema';
import { CreateMedicationRequestDto, UpdateMedicationRequestDto } from './dto/create-medication-request.dto';
export declare class MedicationRequestService {
    private medicationRequestModel;
    constructor(medicationRequestModel: Model<MedicationRequest>);
    getRequestsByPharmacy(pharmacyId: string, status?: RequestStatus): Promise<MedicationRequest[]>;
    getRequestById(pharmacyId: string, requestId: string): Promise<MedicationRequest>;
    createRequest(pharmacyId: string, createDto: CreateMedicationRequestDto): Promise<MedicationRequest>;
    updateRequest(pharmacyId: string, requestId: string, updateDto: UpdateMedicationRequestDto): Promise<MedicationRequest>;
    deleteRequest(pharmacyId: string, requestId: string): Promise<void>;
    getDashboard(pharmacyId: string): Promise<{
        pharmacyInfo: {
            id: string;
            name: string;
            totalOrders: number;
            totalPackages: number;
            offersDelivery: boolean;
        };
        medicationRequests: (import("mongoose").Document<unknown, {}, MedicationRequest, {}, {}> & MedicationRequest & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
}
