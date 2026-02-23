import { ProfilesService } from './profiles.service';
export declare class ProfilesController {
    private readonly profilesService;
    constructor(profilesService: ProfilesService);
    getMyProfile(req: any): Promise<any>;
    updateDoctorProfile(req: any, data: any): Promise<import("./schemas/doctor-profile.schema").DoctorProfileDocument>;
    updatePatientProfile(req: any, data: {
        fullName?: string;
        gender: string;
        age: number;
        height: number;
        weight: number;
        allergies: string[];
    }): Promise<import("../users/schemas/user.schema").UserDocument>;
    updatePharmacyProfile(req: any, data: any): Promise<import("./schemas/pharmacy-profile.schema").PharmacyProfileDocument>;
    updateLabProfile(req: any, data: any): Promise<import("./schemas/lab-profile.schema").LabProfileDocument>;
    updateClinicProfile(req: any, data: any): Promise<import("./schemas/clinic-profile.schema").ClinicProfileDocument>;
    searchDoctors(speciality?: string, city?: string, wilaya?: string): Promise<import("./schemas/doctor-profile.schema").DoctorProfileDocument[]>;
    searchPharmacies(city?: string, wilaya?: string, is24Hours?: boolean, hasDelivery?: boolean): Promise<import("./schemas/pharmacy-profile.schema").PharmacyProfileDocument[]>;
    searchLabs(localisation?: string, categorie?: string): Promise<import("./schemas/lab-profile.schema").LabProfileDocument[]>;
    getAllPatients(): Promise<import("./schemas/patient-profile.schema").PatientProfileDocument[]>;
}
