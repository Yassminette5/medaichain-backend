import { Model } from 'mongoose';
import { DeliveryDocument, DeliveryStatus } from './delivery.schema';
export declare class DeliveryService {
    private deliveryModel;
    constructor(deliveryModel: Model<DeliveryDocument>);
    createDelivery(data: {
        medicationRequestId: string;
        pharmacyId: string;
        patientId: string;
        deliveryAddress: string;
        deliveryCity: string;
        deliveryPostalCode: string;
        gpsLatitude: number;
        gpsLongitude: number;
        estimatedDeliveryTime: Date;
        deliveryFee: number;
        notes?: string;
    }): Promise<DeliveryDocument>;
    getDeliveryById(deliveryId: string): Promise<DeliveryDocument>;
    getDeliveriesByPharmacy(pharmacyId: string): Promise<DeliveryDocument[]>;
    getDeliveriesByPatient(patientId: string): Promise<DeliveryDocument[]>;
    updateDeliveryStatus(deliveryId: string, status: DeliveryStatus, driverInfo?: {
        driverId: string;
        driverName: string;
        driverPhone: string;
    }): Promise<DeliveryDocument>;
    getDeliveryByTrackingCode(trackingCode: string): Promise<DeliveryDocument>;
    cancelDelivery(deliveryId: string, reason: string): Promise<DeliveryDocument>;
}
