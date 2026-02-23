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
exports.PrescriptionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const prescription_schema_1 = require("./schemas/prescription.schema");
const notifications_service_1 = require("../notifications/notifications.service");
let PrescriptionsService = class PrescriptionsService {
    constructor(prescriptionModel, notificationsService) {
        this.prescriptionModel = prescriptionModel;
        this.notificationsService = notificationsService;
    }
    async create(createPrescriptionDto, doctorId) {
        const prescription = new this.prescriptionModel({
            ...createPrescriptionDto,
            doctorId: new mongoose_2.Types.ObjectId(doctorId),
            patientId: new mongoose_2.Types.ObjectId(createPrescriptionDto.patientId),
            prescriptionDate: new Date(),
        });
        const saved = await prescription.save();
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
    async findByPatient(patientId) {
        return this.prescriptionModel
            .find({ patientId: new mongoose_2.Types.ObjectId(patientId) })
            .populate('doctorId', 'email')
            .sort({ createdAt: -1 })
            .exec();
    }
    async findByDoctor(doctorId) {
        return this.prescriptionModel
            .find({ doctorId: new mongoose_2.Types.ObjectId(doctorId) })
            .populate('patientId', 'email')
            .sort({ createdAt: -1 })
            .exec();
    }
    async findOne(id) {
        return this.prescriptionModel
            .findById(id)
            .populate('patientId', 'email')
            .populate('doctorId', 'email')
            .exec();
    }
    async updateStatus(id, status) {
        return this.prescriptionModel
            .findByIdAndUpdate(id, { status }, { new: true })
            .exec();
    }
};
exports.PrescriptionsService = PrescriptionsService;
exports.PrescriptionsService = PrescriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(prescription_schema_1.Prescription.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        notifications_service_1.NotificationsService])
], PrescriptionsService);
//# sourceMappingURL=prescriptions.service.js.map