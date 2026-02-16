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
exports.MedicationRequestService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const medication_request_schema_1 = require("./schemas/medication-request.schema");
let MedicationRequestService = class MedicationRequestService {
    constructor(medicationRequestModel) {
        this.medicationRequestModel = medicationRequestModel;
    }
    async getRequestsByPharmacy(pharmacyId, status) {
        const filter = { pharmacyId };
        if (status && status !== medication_request_schema_1.RequestStatus.TOUT) {
            filter.status = status;
        }
        return await this.medicationRequestModel.find(filter).exec();
    }
    async getRequestById(pharmacyId, requestId) {
        const request = await this.medicationRequestModel
            .findOne({ _id: requestId, pharmacyId })
            .exec();
        if (!request) {
            throw new common_1.NotFoundException('Request not found');
        }
        return request;
    }
    async createRequest(pharmacyId, createDto) {
        const patient = {
            id: createDto.patientId,
            name: createDto.patientName,
            phoneNumber: createDto.patientPhone,
        };
        const medication = {
            id: Date.now().toString(),
            name: createDto.medicationName,
            dosage: createDto.medicationDosage,
            quantity: createDto.quantity,
            unit: createDto.unit || 'unités',
        };
        const newRequest = await this.medicationRequestModel.create({
            pharmacyId,
            patient,
            medication,
            status: createDto.isUrgent ? medication_request_schema_1.RequestStatus.URGENT : medication_request_schema_1.RequestStatus.EN_ATTENTE,
            requestDate: new Date(),
            isUrgent: createDto.isUrgent || false,
        });
        return newRequest;
    }
    async updateRequest(pharmacyId, requestId, updateDto) {
        const updatedRequest = await this.medicationRequestModel
            .findOneAndUpdate({ _id: requestId, pharmacyId }, updateDto, { new: true })
            .exec();
        if (!updatedRequest) {
            throw new common_1.NotFoundException('Request not found');
        }
        return updatedRequest;
    }
    async deleteRequest(pharmacyId, requestId) {
        const result = await this.medicationRequestModel
            .deleteOne({ _id: requestId, pharmacyId })
            .exec();
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException('Request not found');
        }
    }
    async getDashboard(pharmacyId) {
        const requests = await this.medicationRequestModel.find({ pharmacyId }).exec();
        return {
            pharmacyInfo: {
                id: pharmacyId,
                name: 'Pharmacie Centrale',
                totalOrders: requests.length,
                totalPackages: requests.reduce((sum, r) => sum + r.medication.quantity, 0),
            },
            medicationRequests: requests,
        };
    }
};
exports.MedicationRequestService = MedicationRequestService;
exports.MedicationRequestService = MedicationRequestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(medication_request_schema_1.MedicationRequest.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MedicationRequestService);
//# sourceMappingURL=medication-request.service.js.map