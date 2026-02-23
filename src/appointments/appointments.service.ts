import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CalendarEvent, CalendarEventDocument } from './schemas/calendar-event.schema';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto/calendar-event.dto';
import { Notification } from '../notifications/schemas/notification.schema';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectModel(CalendarEvent.name) private eventModel: Model<CalendarEventDocument>,
        @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    ) { }

    // ========== CRÉER UN ÉVÉNEMENT ==========
    async create(doctorId: string, dto: CreateCalendarEventDto): Promise<CalendarEventDocument> {
        const event = new this.eventModel({
            ...dto,
            doctorId: new Types.ObjectId(doctorId),
            dateTime: new Date(dto.dateTime),
            endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        });
        const savedEvent = await event.save();

        // Créer une notification pour le médecin
        await this.createNotificationForEvent(doctorId, savedEvent);

        return savedEvent;
    }

    // ========== CRÉER UNE NOTIFICATION POUR UN ÉVÉNEMENT ==========
    private async createNotificationForEvent(doctorId: string, event: CalendarEventDocument): Promise<void> {
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
                userId: new Types.ObjectId(doctorId),
                title,
                message,
                type,
                isRead: false,
                relatedEntity: 'appointment',
                relatedEntityId: event._id,
            });

            await notification.save();
        } catch (error) {
            console.error('Error creating notification:', error);
            // Ne pas bloquer la création de l'événement si la notification échoue
        }
    }

    // ========== OBTENIR TOUS LES ÉVÉNEMENTS D'UN MÉDECIN ==========
    async findAllByDoctor(doctorId: string): Promise<CalendarEventDocument[]> {
        return this.eventModel
            .find({ doctorId: new Types.ObjectId(doctorId) })
            .sort({ dateTime: 1 })
            .exec();
    }

    // ========== OBTENIR LES ÉVÉNEMENTS PAR MOIS ==========
    async findByMonth(doctorId: string, year: number, month: number): Promise<CalendarEventDocument[]> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        return this.eventModel
            .find({
                doctorId: new Types.ObjectId(doctorId),
                dateTime: { $gte: startDate, $lte: endDate },
            })
            .sort({ dateTime: 1 })
            .exec();
    }

    // ========== OBTENIR UN ÉVÉNEMENT PAR ID ==========
    async findById(doctorId: string, eventId: string): Promise<CalendarEventDocument> {
        const event = await this.eventModel.findOne({
            _id: new Types.ObjectId(eventId),
            doctorId: new Types.ObjectId(doctorId),
        }).exec();

        if (!event) {
            throw new NotFoundException('Événement non trouvé');
        }
        return event;
    }

    // ========== METTRE À JOUR UN ÉVÉNEMENT ==========
    async update(doctorId: string, eventId: string, dto: UpdateCalendarEventDto): Promise<CalendarEventDocument> {
        const updateData: any = { ...dto };
        if (dto.dateTime) updateData.dateTime = new Date(dto.dateTime);
        if (dto.endTime) updateData.endTime = new Date(dto.endTime);

        const event = await this.eventModel.findOneAndUpdate(
            {
                _id: new Types.ObjectId(eventId),
                doctorId: new Types.ObjectId(doctorId),
            },
            updateData,
            { new: true },
        ).exec();

        if (!event) {
            throw new NotFoundException('Événement non trouvé');
        }
        return event;
    }

    // ========== SUPPRIMER UN ÉVÉNEMENT ==========
    async delete(doctorId: string, eventId: string): Promise<void> {
        const result = await this.eventModel.deleteOne({
            _id: new Types.ObjectId(eventId),
            doctorId: new Types.ObjectId(doctorId),
        }).exec();

        if (result.deletedCount === 0) {
            throw new NotFoundException('Événement non trouvé');
        }
    }
}
