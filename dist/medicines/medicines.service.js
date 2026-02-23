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
exports.MedicinesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const medicine_schema_1 = require("./schemas/medicine.schema");
let MedicinesService = class MedicinesService {
    medicineModel;
    constructor(medicineModel) {
        this.medicineModel = medicineModel;
    }
    async create(userId, data) {
        const newMedicine = new this.medicineModel({
            ...data,
            userId: new mongoose_2.Types.ObjectId(userId),
        });
        return newMedicine.save();
    }
    async findAll(userId) {
        return this.medicineModel.find({ userId: new mongoose_2.Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
    }
    async findOne(id) {
        const medicine = await this.medicineModel.findById(id).exec();
        if (!medicine) {
            throw new common_1.NotFoundException('Médicament non trouvé');
        }
        return medicine;
    }
    async remove(id, userId) {
        return this.medicineModel.findOneAndDelete({ _id: id, userId: new mongoose_2.Types.ObjectId(userId) }).exec();
    }
};
exports.MedicinesService = MedicinesService;
exports.MedicinesService = MedicinesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(medicine_schema_1.Medicine.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MedicinesService);
//# sourceMappingURL=medicines.service.js.map