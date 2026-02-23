"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const notification_schema_1 = require("./notification.schema");
let NotificationService = class NotificationService {
    constructor(notificationModel) {
        this.notificationModel = notificationModel;
    }
    async createNotification(data) {
        const notification = new this.notificationModel({
            userId: new mongoose_2.Types.ObjectId(data.userId),
            type: data.type,
            title: data.title,
            message: data.message,
            relatedId: data.relatedId,
            data: data.data || {},
        });
        return notification.save();
    }
    async getNotifications(userId, limit = 20, skip = 0) {
        return this.notificationModel
            .find({ userId: new mongoose_2.Types.ObjectId(userId), isActive: true })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .exec();
    }
    async getUnreadNotifications(userId) {
        return this.notificationModel
            .find({
            userId: new mongoose_2.Types.ObjectId(userId),
            isRead: false,
            isActive: true,
        })
            .sort({ createdAt: -1 })
            .exec();
    }
    async getUnreadCount(userId) {
        return this.notificationModel.countDocuments({
            userId: new mongoose_2.Types.ObjectId(userId),
            isRead: false,
            isActive: true,
        });
    }
    async markAsRead(notificationId) {
        const notification = await this.notificationModel
            .findByIdAndUpdate(notificationId, { isRead: true, readAt: new Date() }, { new: true })
            .exec();
        if (!notification) {
            throw new common_1.NotFoundException('Notification non trouvée');
        }
        return notification;
    }
    async markAllAsRead(userId) {
        return this.notificationModel.updateMany({ userId: new mongoose_2.Types.ObjectId(userId), isRead: false }, { isRead: true, readAt: new Date() });
    }
    async deleteNotification(notificationId) {
        const notification = await this.notificationModel
            .findByIdAndUpdate(notificationId, { isActive: false }, { new: true })
            .exec();
        if (!notification) {
            throw new common_1.NotFoundException('Notification non trouvée');
        }
        return notification;
    }
    async deleteAllNotifications(userId) {
        return this.notificationModel.updateMany({ userId: new mongoose_2.Types.ObjectId(userId) }, { isActive: false });
    }
    async getNotificationsByType(userId, type) {
        return this.notificationModel
            .find({
            userId: new mongoose_2.Types.ObjectId(userId),
            type,
            isActive: true,
        })
            .sort({ createdAt: -1 })
            .exec();
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], NotificationService);
//# sourceMappingURL=notification.service.js.map