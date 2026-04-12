import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as admin from 'firebase-admin';
import { User, UserDocument } from '../users/schemas/user.schema';
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
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  private firebaseReady = false;

  getFirebaseStatus(): {
    configured: boolean;
    initialized: boolean;
    projectId?: string;
    usingServiceAccountPath: boolean;
  } {
    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    const configured = Boolean(
      serviceAccountPath || (projectId && clientEmail && privateKey),
    );

    return {
      configured,
      initialized: this.firebaseReady || admin.apps.length > 0,
      projectId,
      usingServiceAccountPath: Boolean(serviceAccountPath),
    };
  }

  private initFirebaseIfNeeded(): boolean {
    if (this.firebaseReady) {
      return true;
    }

    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    try {
      if (admin.apps.length === 0) {
        if (serviceAccountPath) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const serviceAccount = require(serviceAccountPath);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        } else {
          if (!projectId || !clientEmail || !privateKey) {
            return false;
          }

          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
        }
      }
      this.firebaseReady = true;
    } catch (error) {
      console.error('[NotificationService] Firebase init error:', error);
      this.firebaseReady = false;
    }

    return this.firebaseReady;
  }

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

  async sendPushToUser(data: {
    userId: string;
    title: string;
    message: string;
    payload?: Record<string, string>;
  }): Promise<void> {
    try {
      if (!this.initFirebaseIfNeeded()) {
        console.warn(
          '[NotificationService] Push skipped (Firebase not configured). Set FIREBASE_SERVICE_ACCOUNT_PATH (recommended) or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.',
        );
        return;
      }

      const user = await this.userModel.findById(data.userId).exec();
      if (!user) {
        console.warn(
          `[NotificationService] Push skipped (user not found): ${data.userId}`,
        );
        return;
      }
      if (!user?.fcmToken) {
        console.warn(
          `[NotificationService] Push skipped (missing fcmToken) for user: ${data.userId}`,
        );
        return;
      }

      await admin.messaging().send({
        token: user.fcmToken,
        notification: {
          title: data.title,
          body: data.message,
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'ordonnance_channel',
            sound: 'default',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
        data: data.payload || {},
      });
    } catch (error) {
      console.error('[NotificationService] Push send error:', error);
    }
  }
}
