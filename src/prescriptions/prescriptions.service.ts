import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Prescription } from './schemas/prescription.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectModel(Prescription.name)
    private prescriptionModel: Model<Prescription>,
    private notificationsService: NotificationsService,
  ) {}

  async create(createPrescriptionDto: any, doctorId: string): Promise<Prescription> {
    const prescription = new this.prescriptionModel({
      ...createPrescriptionDto,
      doctorId: new Types.ObjectId(doctorId),
      patientId: new Types.ObjectId(createPrescriptionDto.patientId),
      prescriptionDate: new Date(),
    });
    
    const saved = await prescription.save();

    // Create notification for patient
    await this.notificationsService.create({
      userId: createPrescriptionDto.patientId,
      title: 'Nouvelle ordonnance',
      message: 'Vous avez reçu une nouvelle ordonnance de votre médecin',
      type: 'info',
      relatedEntity: 'prescription',
      relatedEntityId: saved._id,
    });

    return saved;
  }

  async findByPatient(patientId: string): Promise<Prescription[]> {
    return this.prescriptionModel
      .find({ patientId: new Types.ObjectId(patientId) })
      .populate('doctorId', 'email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByDoctor(doctorId: string): Promise<Prescription[]> {
    return this.prescriptionModel
      .find({ doctorId: new Types.ObjectId(doctorId) })
      .populate('patientId', 'email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Prescription> {
    return this.prescriptionModel
      .findById(id)
      .populate('patientId', 'email')
      .populate('doctorId', 'email')
      .exec();
  }

  async updateStatus(id: string, status: string): Promise<Prescription> {
    return this.prescriptionModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
  }
}
