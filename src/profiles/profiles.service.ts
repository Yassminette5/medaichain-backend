import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DoctorProfile, DoctorProfileDocument } from './schemas/doctor-profile.schema';
import { PatientProfile, PatientProfileDocument } from './schemas/patient-profile.schema';
import { PharmacyProfile, PharmacyProfileDocument } from './schemas/pharmacy-profile.schema';
import { LabProfile, LabProfileDocument } from './schemas/lab-profile.schema';
import { ClinicProfile, ClinicProfileDocument } from './schemas/clinic-profile.schema';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class ProfilesService {
    constructor(
        @InjectModel(DoctorProfile.name) private doctorModel: Model<DoctorProfileDocument>,
        @InjectModel(PatientProfile.name) private patientModel: Model<PatientProfileDocument>,
        @InjectModel(PharmacyProfile.name) private pharmacyModel: Model<PharmacyProfileDocument>,
        @InjectModel(LabProfile.name) private labModel: Model<LabProfileDocument>,
        @InjectModel(ClinicProfile.name) private clinicModel: Model<ClinicProfileDocument>,
        private usersService: UsersService,
    ) { }

    // ========== OBTENIR PROFIL ==========
    async getProfile(userId: string, role: UserRole): Promise<any> {
        const roleLower = role.toString().toLowerCase();
        console.log(`[ProfilesService] Fetching profile for userId: ${userId}, role: ${roleLower}`);
        const objectId = new Types.ObjectId(userId);

        switch (roleLower) {
            case UserRole.MEDECIN.toString():
                return this.doctorModel.findOne({ userId: objectId }).exec();
            case UserRole.PATIENT.toString():
                const patientProfile = await this.patientModel.findOne({ userId: objectId }).exec();
                console.log(`[ProfilesService] Patient profile found: ${!!patientProfile}`);
                return patientProfile;
            case UserRole.PHARMACIE.toString():
                return this.pharmacyModel.findOne({ userId: objectId }).exec();
            case UserRole.CENTRE_ANALYSE.toString():
                return this.labModel.findOne({ userId: objectId }).exec();
            case UserRole.CLINIQUE.toString():
                return this.clinicModel.findOne({ userId: objectId }).exec();
            default:
                console.warn(`[ProfilesService] Role match failed for: ${roleLower}`);
                throw new BadRequestException('Rôle invalide');
        }
    }

    // ========== CRÉER/METTRE À JOUR PROFIL MÉDECIN ==========
    async upsertDoctorProfile(userId: string, data: Partial<DoctorProfile>): Promise<DoctorProfileDocument> {
        const objectId = new Types.ObjectId(userId);

        const profile = await this.doctorModel.findOneAndUpdate(
            { userId: objectId },
            { ...data, userId: objectId },
            { upsert: true, new: true }
        ).exec();

        // Marquer le profil comme complété
        await this.usersService.markProfileCompleted(userId);

        return profile;
    }

    // ========== CRÉER/METTRE À JOUR PROFIL PATIENT ==========
    async upsertPatientProfile(userId: string, data: Partial<PatientProfile>): Promise<PatientProfileDocument> {
        const objectId = new Types.ObjectId(userId);

        const profile = await this.patientModel.findOneAndUpdate(
            { userId: objectId },
            { ...data, userId: objectId },
            { upsert: true, new: true }
        ).exec();

        await this.usersService.markProfileCompleted(userId);

        return profile;
    }

    // ========== CRÉER/METTRE À JOUR PROFIL PHARMACIE ==========
    async upsertPharmacyProfile(userId: string, data: Partial<PharmacyProfile>): Promise<PharmacyProfileDocument> {
        const objectId = new Types.ObjectId(userId);

        const profile = await this.pharmacyModel.findOneAndUpdate(
            { userId: objectId },
            { ...data, userId: objectId },
            { upsert: true, new: true }
        ).exec();

        await this.usersService.markProfileCompleted(userId);

        return profile;
    }

    // ========== CRÉER/METTRE À JOUR PROFIL LAB ==========
    async upsertLabProfile(userId: string, data: Partial<LabProfile>): Promise<LabProfileDocument> {
        const objectId = new Types.ObjectId(userId);

        const profile = await this.labModel.findOneAndUpdate(
            { userId: objectId },
            { ...data, userId: objectId },
            { upsert: true, new: true }
        ).exec();

        await this.usersService.markProfileCompleted(userId);

        return profile;
    }

    // ========== CRÉER/METTRE À JOUR PROFIL CLINIQUE ==========
    async upsertClinicProfile(userId: string, data: Partial<ClinicProfile>): Promise<ClinicProfileDocument> {
        const objectId = new Types.ObjectId(userId);

        const profile = await this.clinicModel.findOneAndUpdate(
            { userId: objectId },
            { ...data, userId: objectId },
            { upsert: true, new: true }
        ).exec();

        await this.usersService.markProfileCompleted(userId);

        return profile;
    }

    // ========== RECHERCHER MÉDECINS ==========
    async searchDoctors(filters: {
        speciality?: string;
        city?: string;
        wilaya?: string;
    }): Promise<DoctorProfileDocument[]> {
        const query: any = { isVerified: true };

        if (filters.speciality) query.speciality = new RegExp(filters.speciality, 'i');
        if (filters.city) query.city = new RegExp(filters.city, 'i');
        if (filters.wilaya) query.wilaya = new RegExp(filters.wilaya, 'i');

        return this.doctorModel.find(query).exec();
    }

    // ========== RECHERCHER PHARMACIES ==========
    async searchPharmacies(filters: {
        city?: string;
        wilaya?: string;
        is24Hours?: boolean;
        hasDelivery?: boolean;
    }): Promise<PharmacyProfileDocument[]> {
        const query: any = { isVerified: true };

        if (filters.city) query.city = new RegExp(filters.city, 'i');
        if (filters.wilaya) query.wilaya = new RegExp(filters.wilaya, 'i');
        if (filters.is24Hours) query.is24Hours = true;
        if (filters.hasDelivery) query.hasDelivery = true;

        return this.pharmacyModel.find(query).exec();
    }

    // ========== RECHERCHER LABS ==========
    async searchLabs(filters: {
        localisation?: string;
        categorie?: string;
        analysisType?: string;
    }): Promise<LabProfileDocument[]> {
        const query: any = { isVerified: true };

        if (filters.localisation) query.localisation = new RegExp(filters.localisation, 'i');
        if (filters.categorie) query.categorie = new RegExp(filters.categorie, 'i');

        return this.labModel.find(query).exec();
    }
}
