import { Model } from 'mongoose';
import { MedicineDocument } from './schemas/medicine.schema';
export declare class MedicinesService {
    private medicineModel;
    constructor(medicineModel: Model<MedicineDocument>);
    create(userId: string, data: any): Promise<MedicineDocument>;
    findAll(userId: string): Promise<MedicineDocument[]>;
    findOne(id: string): Promise<MedicineDocument>;
    remove(id: string, userId: string): Promise<any>;
}
