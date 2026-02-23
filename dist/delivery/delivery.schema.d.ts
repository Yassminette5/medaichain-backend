import { Document, Types } from 'mongoose';
export type DeliveryDocument = Delivery & Document;
export declare enum DeliveryStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    IN_TRANSIT = "in_transit",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export declare class Delivery {
    medicationRequestId: Types.ObjectId;
    pharmacyId: Types.ObjectId;
    patientId: Types.ObjectId;
    status: DeliveryStatus;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryPostalCode: string;
    gpsLatitude: number;
    gpsLongitude: number;
    estimatedDeliveryTime: Date;
    actualDeliveryTime: Date;
    deliveryFee: number;
    notes: string;
    driverId: string;
    driverName: string;
    driverPhone: string;
    trackingCode: string;
}
export declare const DeliverySchema: import("mongoose").Schema<Delivery, import("mongoose").Model<Delivery, any, any, any, Document<unknown, any, Delivery, any, {}> & Delivery & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Delivery, Document<unknown, {}, import("mongoose").FlatRecord<Delivery>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Delivery> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
