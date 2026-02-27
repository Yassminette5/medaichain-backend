import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CalendarEvent, CalendarEventDocument } from './schemas/appointment.schema';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectModel(CalendarEvent.name) private appointmentModel: Model<CalendarEventDocument>,
    ) { }

    async create(userId: string, dto: CreateAppointmentDto): Promise<CalendarEventDocument> {
        const appointment = new this.appointmentModel({
            ...dto,
            userId: new Types.ObjectId(userId),
        });
        return appointment.save();
    }

    async findAllForUser(userId: string): Promise<CalendarEventDocument[]> {
        return this.appointmentModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ dateTime: 1 })
            .exec();
    }

    async findOne(userId: string, appointmentId: string): Promise<CalendarEventDocument> {
        const appointment = await this.appointmentModel.findOne({
            _id: new Types.ObjectId(appointmentId),
            userId: new Types.ObjectId(userId),
        }).exec();

        if (!appointment) {
            throw new NotFoundException('Événement non trouvé');
        }
        return appointment;
    }

    async update(userId: string, appointmentId: string, dto: UpdateAppointmentDto): Promise<CalendarEventDocument> {
        const appointment = await this.appointmentModel.findOneAndUpdate(
            { _id: new Types.ObjectId(appointmentId), userId: new Types.ObjectId(userId) },
            dto,
            { new: true }
        ).exec();

        if (!appointment) {
            throw new NotFoundException('Événement non trouvé');
        }
        return appointment;
    }

    async remove(userId: string, appointmentId: string): Promise<{ message: string }> {
        const result = await this.appointmentModel.deleteOne({
            _id: new Types.ObjectId(appointmentId),
            userId: new Types.ObjectId(userId),
        }).exec();

        if (result.deletedCount === 0) {
            throw new NotFoundException('Événement non trouvé');
        }

        return { message: 'Événement supprimé avec succès' };
    }
}
