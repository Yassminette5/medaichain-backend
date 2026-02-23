import { PrescriptionsService } from './prescriptions.service';
export declare class PrescriptionsController {
    private readonly prescriptionsService;
    constructor(prescriptionsService: PrescriptionsService);
    create(createPrescriptionDto: any, req: any): Promise<import("./schemas/prescription.schema").Prescription>;
    getByPatient(patientId: string): Promise<import("./schemas/prescription.schema").Prescription[]>;
    getMyPrescriptions(req: any): Promise<import("./schemas/prescription.schema").Prescription[]>;
    getOne(id: string): Promise<import("./schemas/prescription.schema").Prescription>;
    updateStatus(id: string, body: {
        status: string;
    }): Promise<import("./schemas/prescription.schema").Prescription>;
}
