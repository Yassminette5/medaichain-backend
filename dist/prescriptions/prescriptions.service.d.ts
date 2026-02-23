import { Model } from 'mongoose';
import { Prescription } from './schemas/prescription.schema';
import { NotificationsService } from '../notifications/notifications.service';
export declare class PrescriptionsService {
    private prescriptionModel;
    private notificationsService;
    constructor(prescriptionModel: Model<Prescription>, notificationsService: NotificationsService);
    create(createPrescriptionDto: any, doctorId: string): Promise<Prescription>;
    findByPatient(patientId: string): Promise<Prescription[]>;
    findByDoctor(doctorId: string): Promise<Prescription[]>;
    findOne(id: string): Promise<Prescription>;
    updateStatus(id: string, status: string): Promise<Prescription>;
}
