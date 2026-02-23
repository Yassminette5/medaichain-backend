import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Delivery, DeliveryDocument, DeliveryStatus } from './delivery.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
  ) {}

  async createDelivery(data: {
    medicationRequestId: string;
    pharmacyId: string;
    patientId: string;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryPostalCode: string;
    gpsLatitude: number;
    gpsLongitude: number;
    estimatedDeliveryTime: Date;
    deliveryFee: number;
    notes?: string;
  }): Promise<DeliveryDocument> {
    const trackingCode = `DEL-${uuidv4().substring(0, 8).toUpperCase()}`;

    const delivery = new this.deliveryModel({
      medicationRequestId: new Types.ObjectId(data.medicationRequestId),
      pharmacyId: new Types.ObjectId(data.pharmacyId),
      patientId: new Types.ObjectId(data.patientId),
      deliveryAddress: data.deliveryAddress,
      deliveryCity: data.deliveryCity,
      deliveryPostalCode: data.deliveryPostalCode,
      gpsLatitude: data.gpsLatitude,
      gpsLongitude: data.gpsLongitude,
      estimatedDeliveryTime: data.estimatedDeliveryTime,
      deliveryFee: data.deliveryFee,
      notes: data.notes,
      trackingCode,
      status: DeliveryStatus.PENDING,
    });

    return delivery.save();
  }

  async getDeliveryById(deliveryId: string): Promise<DeliveryDocument> {
    const delivery = await this.deliveryModel.findById(deliveryId).exec();
    if (!delivery) {
      throw new NotFoundException('Livraison non trouvée');
    }
    return delivery;
  }

  async getDeliveriesByPharmacy(pharmacyId: string): Promise<DeliveryDocument[]> {
    return this.deliveryModel
      .find({ pharmacyId: new Types.ObjectId(pharmacyId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getDeliveriesByPatient(patientId: string): Promise<DeliveryDocument[]> {
    return this.deliveryModel
      .find({ patientId: new Types.ObjectId(patientId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    driverInfo?: { driverId: string; driverName: string; driverPhone: string },
  ): Promise<DeliveryDocument> {
    const updateData: any = { status };

    if (status === DeliveryStatus.DELIVERED) {
      updateData.actualDeliveryTime = new Date();
    }

    if (driverInfo) {
      updateData.driverId = driverInfo.driverId;
      updateData.driverName = driverInfo.driverName;
      updateData.driverPhone = driverInfo.driverPhone;
    }

    const delivery = await this.deliveryModel
      .findByIdAndUpdate(deliveryId, updateData, { new: true })
      .exec();

    if (!delivery) {
      throw new NotFoundException('Livraison non trouvée');
    }

    return delivery;
  }

  async getDeliveryByTrackingCode(trackingCode: string): Promise<DeliveryDocument> {
    const delivery = await this.deliveryModel
      .findOne({ trackingCode })
      .exec();

    if (!delivery) {
      throw new NotFoundException('Livraison non trouvée');
    }

    return delivery;
  }

  async cancelDelivery(deliveryId: string, reason: string): Promise<DeliveryDocument> {
    const delivery = await this.deliveryModel
      .findByIdAndUpdate(
        deliveryId,
        { status: DeliveryStatus.CANCELLED, notes: reason },
        { new: true },
      )
      .exec();

    if (!delivery) {
      throw new NotFoundException('Livraison non trouvée');
    }

    return delivery;
  }
}
