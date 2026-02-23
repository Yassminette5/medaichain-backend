import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: string;
    data?: Record<string, any>;
  }): Promise<NotificationDocument> {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(data.userId),
      type: data.type,
      title: data.title,
      message: data.message,
      relatedId: data.relatedId,
      data: data.data || {},
    });

    return notification.save();
  }

  async getNotifications(
    userId: string,
    limit: number = 20,
    skip: number = 0,
  ): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId), isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async getUnreadNotifications(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({
        userId: new Types.ObjectId(userId),
        isRead: false,
        isActive: true,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
      isActive: true,
    });
  }

  async markAsRead(notificationId: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel
      .findByIdAndUpdate(
        notificationId,
        { isRead: true, readAt: new Date() },
        { new: true },
      )
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<any> {
    return this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async deleteNotification(notificationId: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel
      .findByIdAndUpdate(
        notificationId,
        { isActive: false },
        { new: true },
      )
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    return notification;
  }

  async deleteAllNotifications(userId: string): Promise<any> {
    return this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId) },
      { isActive: false },
    );
  }

  async getNotificationsByType(
    userId: string,
    type: NotificationType,
  ): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({
        userId: new Types.ObjectId(userId),
        type,
        isActive: true,
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}
