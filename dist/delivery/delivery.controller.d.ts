import { DeliveryService } from './delivery.service';
import { DeliveryStatus } from './delivery.schema';
export declare class DeliveryController {
    private readonly deliveryService;
    constructor(deliveryService: DeliveryService);
    createDelivery(req: any, data: any): Promise<import("./delivery.schema").DeliveryDocument>;
    getDelivery(id: string): Promise<import("./delivery.schema").DeliveryDocument>;
    trackDelivery(trackingCode: string): Promise<import("./delivery.schema").DeliveryDocument>;
    getPharmacyDeliveries(req: any): Promise<import("./delivery.schema").DeliveryDocument[]>;
    getPatientDeliveries(req: any): Promise<import("./delivery.schema").DeliveryDocument[]>;
    updateDeliveryStatus(id: string, data: {
        status: DeliveryStatus;
        driverInfo?: any;
    }): Promise<import("./delivery.schema").DeliveryDocument>;
    cancelDelivery(id: string, data: {
        reason: string;
    }): Promise<import("./delivery.schema").DeliveryDocument>;
}
