import { Model } from 'mongoose';
import { Notification } from './schemas/notification.schema';
export declare class NotificationsService {
    private notificationModel;
    constructor(notificationModel: Model<Notification>);
    create(createNotificationDto: any): Promise<Notification>;
    findByUser(userId: string): Promise<Notification[]>;
    markAsRead(notificationId: string): Promise<Notification>;
    markAllAsRead(userId: string): Promise<any>;
    getUnreadCount(userId: string): Promise<number>;
}
