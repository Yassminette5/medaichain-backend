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
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const calendar_event_schema_1 = require("./schemas/calendar-event.schema");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
let AppointmentsService = class AppointmentsService {
    constructor(eventModel, notificationModel) {
        this.eventModel = eventModel;
        this.notificationModel = notificationModel;
    }
    async create(doctorId, dto) {
        const event = new this.eventModel({
            ...dto,
            doctorId: new mongoose_2.Types.ObjectId(doctorId),
            dateTime: new Date(dto.dateTime),
            endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        });
        const savedEvent = await event.save();
        await this.createNotificationForEvent(doctorId, savedEvent);
        return savedEvent;
    }
    async createNotificationForEvent(doctorId, event) {
        try {
            const eventDate = new Date(event.dateTime);
            const formattedDate = eventDate.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
            const formattedTime = eventDate.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
            });
            let title = '';
            let message = '';
            let type = 'info';
            switch (event.type) {
                case 'consultation':
                    title = 'Nouvelle consultation planifiée';
                    message = `${event.title} le ${formattedDate} à ${formattedTime}`;
                    type = 'info';
                    break;
                case 'operation':
                    title = 'Nouvelle opération planifiée';
                    message = `${event.title} le ${formattedDate} à ${formattedTime}`;
                    type = 'warning';
                    break;
                case 'note':
                    title = 'Nouvelle note ajoutée';
                    message = `${event.title} le ${formattedDate} à ${formattedTime}`;
                    type = 'info';
                    break;
            }
            if (event.patientName) {
                message += ` - Patient: ${event.patientName}`;
            }
            const notification = new this.notificationModel({
                userId: new mongoose_2.Types.ObjectId(doctorId),
                title,
                message,
                type,
                isRead: false,
                relatedEntity: 'appointment',
                relatedEntityId: event._id,
            });
            await notification.save();
        }
        catch (error) {
            console.error('Error creating notification:', error);
        }
    }
    async findAllByDoctor(doctorId) {
        return this.eventModel
            .find({ doctorId: new mongoose_2.Types.ObjectId(doctorId) })
            .sort({ dateTime: 1 })
            .exec();
    }
    async findByMonth(doctorId, year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        return this.eventModel
            .find({
            doctorId: new mongoose_2.Types.ObjectId(doctorId),
            dateTime: { $gte: startDate, $lte: endDate },
        })
            .sort({ dateTime: 1 })
            .exec();
    }
    async findById(doctorId, eventId) {
        const event = await this.eventModel.findOne({
            _id: new mongoose_2.Types.ObjectId(eventId),
            doctorId: new mongoose_2.Types.ObjectId(doctorId),
        }).exec();
        if (!event) {
            throw new common_1.NotFoundException('Événement non trouvé');
        }
        return event;
    }
    async update(doctorId, eventId, dto) {
        const updateData = { ...dto };
        if (dto.dateTime)
            updateData.dateTime = new Date(dto.dateTime);
        if (dto.endTime)
            updateData.endTime = new Date(dto.endTime);
        const event = await this.eventModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(eventId),
            doctorId: new mongoose_2.Types.ObjectId(doctorId),
        }, updateData, { new: true }).exec();
        if (!event) {
            throw new common_1.NotFoundException('Événement non trouvé');
        }
        return event;
    }
    async delete(doctorId, eventId) {
        const result = await this.eventModel.deleteOne({
            _id: new mongoose_2.Types.ObjectId(eventId),
            doctorId: new mongoose_2.Types.ObjectId(doctorId),
        }).exec();
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException('Événement non trouvé');
        }
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(calendar_event_schema_1.CalendarEvent.name)),
    __param(1, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map