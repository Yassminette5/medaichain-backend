import { Model } from 'mongoose';
import { NotificationDocument, NotificationType } from './notification.schema';
export declare class NotificationService {
    private notificationModel;
    constructor(notificationModel: Model<NotificationDocument>);
    createNotification(data: {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        relatedId?: string;
        data?: Record<string, any>;
    }): Promise<NotificationDocument>;
    getNotifications(userId: string, limit?: number, skip?: number): Promise<NotificationDocument[]>;
    getUnreadNotifications(userId: string): Promise<NotificationDocument[]>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(notificationId: string): Promise<NotificationDocument>;
    markAllAsRead(userId: string): Promise<any>;
    deleteNotification(notificationId: string): Promise<NotificationDocument>;
    deleteAllNotifications(userId: string): Promise<any>;
    getNotificationsByType(userId: string, type: NotificationType): Promise<NotificationDocument[]>;
}
