import { Document, Types } from 'mongoose';
export type NotificationDocument = Notification & Document;
export declare enum NotificationType {
    DELIVERY_STATUS = "delivery_status",
    PRESCRIPTION_UPDATE = "prescription_update",
    PHARMACY_MESSAGE = "pharmacy_message",
    SYSTEM_ALERT = "system_alert",
    APPOINTMENT = "appointment",
    PAYMENT = "payment"
}
export declare class Notification {
    userId: Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    relatedId: string;
    isRead: boolean;
    readAt: Date;
    data: Record<string, any>;
    isActive: boolean;
}
export declare const NotificationSchema: import("mongoose").Schema<Notification, import("mongoose").Model<Notification, any, any, any, Document<unknown, any, Notification, any, {}> & Notification & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Notification, Document<unknown, {}, import("mongoose").FlatRecord<Notification>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Notification> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
