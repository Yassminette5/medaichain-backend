import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Prescription, PrescriptionDocument } from './schemas/prescription.schema';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.schema';

@Injectable()
export class PrescriptionsService {
    constructor(
        @InjectModel(Prescription.name)
        private prescriptionModel: Model<PrescriptionDocument>,
        private notificationService: NotificationService,
    ) { }

    // ========== CRÉER UNE ORDONNANCE (MÉDECIN) ==========
    async create(createPrescriptionDto: any, doctorId: string): Promise<PrescriptionDocument> {
        const prescription = new this.prescriptionModel({
            ...createPrescriptionDto,
            doctorId: new Types.ObjectId(doctorId),
            patientId: new Types.ObjectId(createPrescriptionDto.patientId),
            prescriptionDate: new Date(),
            status: 'active',
        });

        const saved = await prescription.save();

        // Notifier le patient (userId doit être une chaîne pour la notification)
        try {
            const patientUserId = String(createPrescriptionDto.patientId ?? saved.patientId?.toString() ?? '');
            if (patientUserId) {
                await this.notificationService.createNotification({
                    userId: patientUserId,
                    title: 'Nouvelle ordonnance',
                    message: 'Vous avez reçu une nouvelle ordonnance de votre médecin.',
                    type: NotificationType.PRESCRIPTION_UPDATE,
                    relatedId: saved._id.toString(),
                    data: {
                        prescriptionId: saved._id.toString(),
                        status: 'active',
                    },
                });
            }
        } catch (error) {
            console.error('[PrescriptionsService] Erreur notification patient:', error);
        }

        return saved;
    }

    // ========== RÉCUPÉRER LES ORDONNANCES D'UN PATIENT ==========
    async findByPatient(patientId: string): Promise<PrescriptionDocument[]> {
        return this.prescriptionModel
            .find({ patientId: new Types.ObjectId(patientId) })
            .populate('doctorId', 'fullName email phone')
            .sort({ createdAt: -1 })
            .exec();
    }

    // ========== RÉCUPÉRER LES ORDONNANCES ÉMISES PAR UN MÉDECIN ==========
    async findByDoctor(doctorId: string): Promise<PrescriptionDocument[]> {
        return this.prescriptionModel
            .find({ doctorId: new Types.ObjectId(doctorId) })
            .populate('patientId', 'email phone')
            .sort({ createdAt: -1 })
            .exec();
    }

    // ========== RÉCUPÉRER UNE ORDONNANCE PAR ID ==========
    async findOne(id: string): Promise<PrescriptionDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('ID ordonnance invalide');
        }
        const prescription = await this.prescriptionModel
            .findById(id)
            .populate('patientId', 'email phone')
            .populate('doctorId', 'email phone')
            .exec();

        if (!prescription) {
            throw new NotFoundException('Ordonnance non trouvée');
        }
        return prescription;
    }

    // ========== METTRE À JOUR LE STATUT D'UNE ORDONNANCE ==========
    async updateStatus(id: string, status: string): Promise<PrescriptionDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('ID ordonnance invalide');
        }

        const prescription = await this.prescriptionModel
            .findByIdAndUpdate(id, { status }, { new: true })
            .exec();

        if (!prescription) {
            throw new NotFoundException('Ordonnance non trouvée');
        }

        // Notifier le patient du changement de statut
        try {
            const statusMessages: Record<string, string> = {
                completed: 'Votre ordonnance a été marquée comme complétée.',
                cancelled: 'Votre ordonnance a été annulée.',
                active: 'Votre ordonnance est à nouveau active.',
            };
            const message = statusMessages[status] || `Le statut de votre ordonnance a été mis à jour : ${status}`;

            await this.notificationService.createNotification({
                userId: prescription.patientId.toString(),
                title: 'Mise à jour ordonnance',
                message,
                type: NotificationType.PRESCRIPTION_UPDATE,
                relatedId: id,
                data: { prescriptionId: id, status },
            });
        } catch (error) {
            console.error('[PrescriptionsService] Erreur notification statut:', error);
        }

        return prescription;
    }

    // ========== SUPPRIMER UNE ORDONNANCE (MÉDECIN SEULEMENT) ==========
    async delete(id: string, doctorId: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('ID ordonnance invalide');
        }

        const prescription = await this.prescriptionModel.findById(id).exec();
        if (!prescription) {
            throw new NotFoundException('Ordonnance non trouvée');
        }
        if (prescription.doctorId.toString() !== doctorId) {
            throw new ForbiddenException('Vous n\'êtes pas autorisé à supprimer cette ordonnance');
        }

        await this.prescriptionModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    }
}
