import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  MedicationRequest,
  Patient,
  RequestedMedication,
  RequestStatus,
} from './schemas/medication-request.schema';
import {
  CreateMedicationRequestDto,
  UpdateMedicationRequestDto,
} from './dto/create-medication-request.dto';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.schema';
import { ProfilesService } from '../profiles/profiles.service';

@Injectable()
export class MedicationRequestService {
  constructor(
    @InjectModel(MedicationRequest.name)
    private medicationRequestModel: Model<MedicationRequest>,
    private notificationService: NotificationService,
    private profilesService: ProfilesService,
  ) {}

  async getRequestsByPharmacy(
    pharmacyId: string,
    status?: RequestStatus,
  ): Promise<MedicationRequest[]> {
    const filter: FilterQuery<MedicationRequest> = { pharmacyId };

    if (status && status !== RequestStatus.TOUT) {
      filter.status = status;
    }

    return await this.medicationRequestModel.find(filter).exec();
  }

  async getRequestById(
    pharmacyId: string,
    requestId: string,
  ): Promise<MedicationRequest> {
    const request = await this.medicationRequestModel
      .findOne({ _id: requestId, pharmacyId })
      .exec();

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }

  async createRequest(
    pharmacyId: string,
    createDto: CreateMedicationRequestDto,
  ): Promise<MedicationRequest> {
    const resolvedPharmacyUserId =
      (await this.profilesService.resolvePharmacyUserId(pharmacyId)) ||
      pharmacyId;

    const patient: Patient = {
      id: createDto.patientId,
      name: createDto.patientName,
      phoneNumber: createDto.patientPhone,
      location: createDto.patientLocation,
    };

    const medications: RequestedMedication[] = createDto.medications.map(
      (med, index) => ({
        id: `${Date.now()}-${index}`,
        name: med.medicationName,
        dosage: med.medicationDosage,
        quantity: med.quantity,
        unit: med.unit || 'unités',
      }),
    );

    const newRequest = await this.medicationRequestModel.create({
      pharmacyId: resolvedPharmacyUserId,
      patient,
      medications,
      status: createDto.isUrgent
        ? RequestStatus.URGENT
        : RequestStatus.EN_ATTENTE,
      requestDate: new Date(),
      isUrgent: createDto.isUrgent || false,
      requestsDelivery: createDto.requestsDelivery || false,
      prescriptionImageUrl: createDto.prescriptionImageUrl,
    });

    const title = 'Nouvelle demande patient';
    const message = `${createDto.patientName} vous a envoyé une ordonnance (${medications.length} médicament(s)).`;

    try {
      await this.notificationService.createNotification({
        userId: resolvedPharmacyUserId,
        type: NotificationType.PHARMACY_MESSAGE,
        title,
        message,
        relatedId: newRequest._id.toString(),
        data: {
          type: 'pharmacy_request_created',
          requestId: newRequest._id.toString(),
          patientId: createDto.patientId,
          patientName: createDto.patientName,
          medicationsCount: medications.length,
          isUrgent: String(createDto.isUrgent || false),
        },
      });

      await this.notificationService.sendPushToUser({
        userId: resolvedPharmacyUserId,
        title,
        message,
        payload: {
          type: 'pharmacy_request_created',
          requestId: newRequest._id.toString(),
          patientId: createDto.patientId,
          patientName: createDto.patientName,
          medicationsCount: String(medications.length),
          isUrgent: String(createDto.isUrgent || false),
        },
      });
    } catch (error) {
      console.error(
        '[MedicationRequestService] Notification/push error:',
        error,
      );
    }

    return newRequest;
  }

  async updateRequest(
    pharmacyId: string,
    requestId: string,
    updateDto: UpdateMedicationRequestDto,
  ): Promise<MedicationRequest> {
    const updatedRequest = await this.medicationRequestModel
      .findOneAndUpdate({ _id: requestId, pharmacyId }, updateDto, {
        new: true,
      })
      .exec();

    if (!updatedRequest) {
      throw new NotFoundException('Request not found');
    }

    return updatedRequest;
  }

  async deleteRequest(pharmacyId: string, requestId: string): Promise<void> {
    const result = await this.medicationRequestModel
      .deleteOne({ _id: requestId, pharmacyId })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Request not found');
    }
  }

  async getDashboard(pharmacyId: string) {
    const requests = await this.medicationRequestModel
      .find({ pharmacyId })
      .exec();

    return {
      pharmacyInfo: {
        id: pharmacyId,
        name: 'Pharmacie Centrale',
        totalOrders: requests.length,
        totalPackages: requests.reduce(
          (sum, r) =>
            sum +
            r.medications.reduce((medSum, med) => medSum + med.quantity, 0),
          0,
        ),
        offersDelivery: true, // In production, fetch from pharmacy profile
      },
      medicationRequests: requests,
    };
  }
}
