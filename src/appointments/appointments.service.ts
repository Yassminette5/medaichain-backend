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

    // ========== CRÉER UN ÉVÉNEMENT ==========
    async create(creatorId: string, dto: CreateAppointmentDto): Promise<CalendarEventDocument> {
        // Si c'est un patient qui crée, on utilise le doctorId du DTO
        // Sinon (médecin), creatorId est le médecin.
        const doctorId = dto.doctorId || creatorId;
        const patientId = dto.patientId || (dto.doctorId ? creatorId : undefined);

        const appointment = new this.appointmentModel({
            ...dto,
            userId: new Types.ObjectId(doctorId),
            patientId: patientId ? new Types.ObjectId(patientId) : undefined,
            dateTime: new Date(dto.dateTime),
            endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        });
        return appointment.save();
    }

    // ========== OBTENIR TOUS LES ÉVÉNEMENTS D'UN MÉDECIN ==========
    async findAllByDoctor(doctorId: string): Promise<CalendarEventDocument[]> {
        return this.appointmentModel
            .find({ userId: new Types.ObjectId(doctorId) })
            .sort({ dateTime: 1 })
            .exec();
    }

    // Alias pour compatibilité descendante
    async findAllForUser(userId: string): Promise<CalendarEventDocument[]> {
        return this.findAllByDoctor(userId);
    }

    // ========== OBTENIR TOUS LES ÉVÉNEMENTS D'UN PATIENT ==========
    async findAllByPatient(patientId: string): Promise<CalendarEventDocument[]> {
        return this.appointmentModel
            .find({ patientId: new Types.ObjectId(patientId) })
            .populate('userId', 'fullName email phone speciality hospital')
            .sort({ dateTime: 1 })
            .exec();
    }

    // ========== OBTENIR LES ÉVÉNEMENTS PAR MOIS ==========
    async findByMonth(doctorId: string, year: number, month: number): Promise<CalendarEventDocument[]> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        return this.appointmentModel
            .find({
                userId: new Types.ObjectId(doctorId),
                dateTime: { $gte: startDate, $lte: endDate },
            })
            .sort({ dateTime: 1 })
            .exec();
    }

    // ========== OBTENIR UN ÉVÉNEMENT PAR ID ==========
    async findById(doctorId: string, eventId: string): Promise<CalendarEventDocument> {
        const appointment = await this.appointmentModel.findOne({
            _id: new Types.ObjectId(eventId),
            userId: new Types.ObjectId(doctorId),
        }).exec();

        if (!appointment) {
            throw new NotFoundException('Événement non trouvé');
        }
        return appointment;
    }

    // Alias pour compatibilité descendante
    async findOne(userId: string, appointmentId: string): Promise<CalendarEventDocument> {
        return this.findById(userId, appointmentId);
    }

    // ========== METTRE À JOUR UN ÉVÉNEMENT ==========
    async update(doctorId: string, eventId: string, dto: UpdateAppointmentDto): Promise<CalendarEventDocument> {
        const updateData: any = { ...dto };
        if (dto.dateTime) updateData.dateTime = new Date(dto.dateTime);
        if (dto.endTime) updateData.endTime = new Date(dto.endTime);

        const appointment = await this.appointmentModel.findOneAndUpdate(
            { _id: new Types.ObjectId(eventId), userId: new Types.ObjectId(doctorId) },
            updateData,
            { new: true }
        ).exec();

        if (!appointment) {
            throw new NotFoundException('Événement non trouvé');
        }
        return appointment;
    }

    // ========== SUPPRIMER UN ÉVÉNEMENT ==========
    async remove(doctorId: string, eventId: string): Promise<{ message: string }> {
        const result = await this.appointmentModel.deleteOne({
            _id: new Types.ObjectId(eventId),
            userId: new Types.ObjectId(doctorId),
        }).exec();

        if (result.deletedCount === 0) {
            throw new NotFoundException('Événement non trouvé');
        }

        return { message: 'Événement supprimé avec succès' };
    }
}
