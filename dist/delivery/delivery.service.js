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
exports.DeliveryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const delivery_schema_1 = require("./delivery.schema");
const uuid_1 = require("uuid");
let DeliveryService = class DeliveryService {
    deliveryModel;
    constructor(deliveryModel) {
        this.deliveryModel = deliveryModel;
    }
    async createDelivery(data) {
        const trackingCode = `DEL-${(0, uuid_1.v4)().substring(0, 8).toUpperCase()}`;
        const delivery = new this.deliveryModel({
            medicationRequestId: new mongoose_2.Types.ObjectId(data.medicationRequestId),
            pharmacyId: new mongoose_2.Types.ObjectId(data.pharmacyId),
            patientId: new mongoose_2.Types.ObjectId(data.patientId),
            deliveryAddress: data.deliveryAddress,
            deliveryCity: data.deliveryCity,
            deliveryPostalCode: data.deliveryPostalCode,
            gpsLatitude: data.gpsLatitude,
            gpsLongitude: data.gpsLongitude,
            estimatedDeliveryTime: data.estimatedDeliveryTime,
            deliveryFee: data.deliveryFee,
            notes: data.notes,
            trackingCode,
            status: delivery_schema_1.DeliveryStatus.PENDING,
        });
        return delivery.save();
    }
    async getDeliveryById(deliveryId) {
        const delivery = await this.deliveryModel.findById(deliveryId).exec();
        if (!delivery) {
            throw new common_1.NotFoundException('Livraison non trouvée');
        }
        return delivery;
    }
    async getDeliveriesByPharmacy(pharmacyId) {
        return this.deliveryModel
            .find({ pharmacyId: new mongoose_2.Types.ObjectId(pharmacyId) })
            .sort({ createdAt: -1 })
            .exec();
    }
    async getDeliveriesByPatient(patientId) {
        return this.deliveryModel
            .find({ patientId: new mongoose_2.Types.ObjectId(patientId) })
            .sort({ createdAt: -1 })
            .exec();
    }
    async updateDeliveryStatus(deliveryId, status, driverInfo) {
        const updateData = { status };
        if (status === delivery_schema_1.DeliveryStatus.DELIVERED) {
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
            throw new common_1.NotFoundException('Livraison non trouvée');
        }
        return delivery;
    }
    async getDeliveryByTrackingCode(trackingCode) {
        const delivery = await this.deliveryModel
            .findOne({ trackingCode })
            .exec();
        if (!delivery) {
            throw new common_1.NotFoundException('Livraison non trouvée');
        }
        return delivery;
    }
    async cancelDelivery(deliveryId, reason) {
        const delivery = await this.deliveryModel
            .findByIdAndUpdate(deliveryId, { status: delivery_schema_1.DeliveryStatus.CANCELLED, notes: reason }, { new: true })
            .exec();
        if (!delivery) {
            throw new common_1.NotFoundException('Livraison non trouvée');
        }
        return delivery;
    }
};
exports.DeliveryService = DeliveryService;
exports.DeliveryService = DeliveryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(delivery_schema_1.Delivery.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], DeliveryService);
//# sourceMappingURL=delivery.service.js.map