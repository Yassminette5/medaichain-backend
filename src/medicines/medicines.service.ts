import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Medicine, MedicineDocument } from './schemas/medicine.schema';

@Injectable()
export class MedicinesService {
    constructor(
        @InjectModel(Medicine.name) private medicineModel: Model<MedicineDocument>,
    ) { }

    async create(userId: string, data: any): Promise<MedicineDocument> {
        const newMedicine = new this.medicineModel({
            ...data,
            userId: new Types.ObjectId(userId),
        });
        return newMedicine.save();
    }

    async findAll(userId: string): Promise<MedicineDocument[]> {
        return this.medicineModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
    }

    async findOne(id: string): Promise<MedicineDocument> {
        const medicine = await this.medicineModel.findById(id).exec();
        if (!medicine) {
            throw new NotFoundException('Médicament non trouvé');
        }
        return medicine;
    }

    async remove(id: string, userId: string): Promise<any> {
        return this.medicineModel.findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) }).exec();
    }
}
