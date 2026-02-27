import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DoctorProfile, DoctorProfileDocument } from './schemas/doctor-profile.schema';
import { PatientInformation, PatientInformationDocument } from './schemas/patient_information.schema';
import { PharmacyProfile, PharmacyProfileDocument } from './schemas/pharmacy-profile.schema';
import { LabProfile, LabProfileDocument } from './schemas/lab-profile.schema';
import { ClinicProfile, ClinicProfileDocument } from './schemas/clinic-profile.schema';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class ProfilesService {
    constructor(
        @InjectModel(DoctorProfile.name) private doctorModel: Model<DoctorProfileDocument>,
        @InjectModel(PatientInformation.name) private patientModel: Model<PatientInformationDocument>,
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
        if (!userId || userId === 'undefined') {
            throw new BadRequestException('ID utilisateur manquant pour la mise à jour du profil médecin');
        }
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
    async upsertPatientInformation(userId: string, data: Partial<PatientInformation>): Promise<PatientInformationDocument> {
        if (!userId || userId === 'undefined') {
            throw new BadRequestException('ID utilisateur manquant pour la mise à jour des informations');
        }
        const objectId = new Types.ObjectId(userId);

        console.log(`[ProfilesService] Upserting PatientInformation for userId: ${userId}`);

        // On utilise l'ID de l'utilisateur comme ID unique pour ses informations
        const profile = await this.patientModel.findByIdAndUpdate(
            objectId,
            {
                ...data,
                userId: objectId
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).exec();

        console.log(`[ProfilesService] PatientInformation upserted: ${profile._id}`);

        // Lier directement dans le document User
        await this.usersService.update(userId, {
            patientInformation: objectId
        } as any);

        await this.usersService.markProfileCompleted(userId);

        return profile;
    }

    // ========== CRÉER/METTRE À JOUR PROFIL PHARMACIE ==========
    async upsertPharmacyProfile(userId: string, data: Partial<PharmacyProfile>): Promise<PharmacyProfileDocument> {
        if (!userId || userId === 'undefined') {
            throw new BadRequestException('ID utilisateur manquant pour la mise à jour du profil pharmacie');
        }
        const objectId = new Types.ObjectId(userId);

        try {
            const profile = await this.pharmacyModel.findOneAndUpdate(
                { userId: objectId },
                { ...data, userId: objectId },
                { upsert: true, new: true, runValidators: false }
            ).exec();

            await this.usersService.markProfileCompleted(userId);

            return profile;
        } catch (error) {
            console.error('Error updating pharmacy profile:', error);
            throw error;
        }
    }

    // ========== CRÉER/METTRE À JOUR PROFIL LAB ==========
    async upsertLabProfile(userId: string, data: Partial<LabProfile>): Promise<LabProfileDocument> {
        if (!userId || userId === 'undefined') {
            throw new BadRequestException('ID utilisateur manquant pour la mise à jour du profil laboratoire');
        }
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
        if (!userId || userId === 'undefined') {
            throw new BadRequestException('ID utilisateur manquant pour la mise à jour du profil clinique');
        }
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

    // ========== GET TOUS LES PATIENTS ==========
    async getAllPatients(): Promise<any[]> {
        return this.patientModel
            .find()
            .populate('userId', 'phone email')
            .lean()
            .exec();
    }
}
