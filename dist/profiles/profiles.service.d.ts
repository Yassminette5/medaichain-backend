import { Model } from 'mongoose';
import { DoctorProfile, DoctorProfileDocument } from './schemas/doctor-profile.schema';
import { PatientInformation, PatientInformationDocument } from './schemas/patient_information.schema';
import { PharmacyProfile, PharmacyProfileDocument } from './schemas/pharmacy-profile.schema';
import { LabProfile, LabProfileDocument } from './schemas/lab-profile.schema';
import { ClinicProfile, ClinicProfileDocument } from './schemas/clinic-profile.schema';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/schemas/user.schema';
export declare class ProfilesService {
    private doctorModel;
    private patientModel;
    private pharmacyModel;
    private labModel;
    private clinicModel;
    private usersService;
    constructor(doctorModel: Model<DoctorProfileDocument>, patientModel: Model<PatientInformationDocument>, pharmacyModel: Model<PharmacyProfileDocument>, labModel: Model<LabProfileDocument>, clinicModel: Model<ClinicProfileDocument>, usersService: UsersService);
    getProfile(userId: string, role: UserRole): Promise<any>;
    upsertDoctorProfile(userId: string, data: Partial<DoctorProfile>): Promise<DoctorProfileDocument>;
    upsertPatientInformation(userId: string, data: Partial<PatientInformation>): Promise<PatientInformationDocument>;
    upsertPharmacyProfile(userId: string, data: Partial<PharmacyProfile>): Promise<PharmacyProfileDocument>;
    upsertLabProfile(userId: string, data: Partial<LabProfile>): Promise<LabProfileDocument>;
    upsertClinicProfile(userId: string, data: Partial<ClinicProfile>): Promise<ClinicProfileDocument>;
    searchDoctors(filters: {
        speciality?: string;
        city?: string;
        wilaya?: string;
    }): Promise<DoctorProfileDocument[]>;
    searchPharmacies(filters: {
        city?: string;
        wilaya?: string;
        is24Hours?: boolean;
        hasDelivery?: boolean;
    }): Promise<PharmacyProfileDocument[]>;
    searchLabs(filters: {
        localisation?: string;
        categorie?: string;
        analysisType?: string;
    }): Promise<LabProfileDocument[]>;
    getSummaryUrl(userId: string): Promise<{
        url: string;
    }>;
}
