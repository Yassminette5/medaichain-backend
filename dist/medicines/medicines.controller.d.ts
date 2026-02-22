import { MedicinesService } from './medicines.service';
export declare class MedicinesController {
    private readonly medicinesService;
    constructor(medicinesService: MedicinesService);
    create(req: any, data: any): Promise<import("./schemas/medicine.schema").MedicineDocument>;
    findAll(req: any): Promise<import("./schemas/medicine.schema").MedicineDocument[]>;
    findOne(id: string): Promise<import("./schemas/medicine.schema").MedicineDocument>;
    remove(req: any, id: string): Promise<any>;
}
