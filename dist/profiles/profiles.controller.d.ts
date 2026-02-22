import { ProfilesService } from './profiles.service';
import { AuthService } from '../auth/auth.service';
export declare class ProfilesController {
    private readonly profilesService;
    private readonly authService;
    constructor(profilesService: ProfilesService, authService: AuthService);
    getMyProfile(req: any): Promise<any>;
    updateDoctorProfile(req: any, data: any): Promise<any>;
    updatePatientInformation(req: any, data: any): Promise<any>;
    updatePharmacyProfile(req: any, data: any): Promise<import("./schemas/pharmacy-profile.schema").PharmacyProfileDocument>;
    updateLabProfile(req: any, data: any): Promise<import("./schemas/lab-profile.schema").LabProfileDocument>;
    updateClinicProfile(req: any, data: any): Promise<import("./schemas/clinic-profile.schema").ClinicProfileDocument>;
    searchDoctors(speciality?: string, city?: string, wilaya?: string): Promise<import("./schemas/doctor-profile.schema").DoctorProfileDocument[]>;
    searchPharmacies(city?: string, wilaya?: string, is24Hours?: boolean, hasDelivery?: boolean): Promise<import("./schemas/pharmacy-profile.schema").PharmacyProfileDocument[]>;
    searchLabs(localisation?: string, categorie?: string): Promise<import("./schemas/lab-profile.schema").LabProfileDocument[]>;
}
