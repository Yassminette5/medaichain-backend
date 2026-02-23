import { NotificationService } from './notification.service';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    getNotifications(req: any, limit?: number, skip?: number): Promise<import("./notification.schema").NotificationDocument[]>;
    getUnreadNotifications(req: any): Promise<import("./notification.schema").NotificationDocument[]>;
    getUnreadCount(req: any): Promise<{
        unreadCount: number;
    }>;
    markAsRead(id: string): Promise<import("./notification.schema").NotificationDocument>;
    markAllAsRead(req: any): Promise<any>;
    deleteNotification(id: string): Promise<import("./notification.schema").NotificationDocument>;
    deleteAllNotifications(req: any): Promise<any>;
}
