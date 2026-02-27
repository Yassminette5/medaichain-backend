import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LabProfile, LabProfileDocument } from './schemas/lab-profile.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class LabService {
    constructor(
        @InjectModel(LabProfile.name) private labModel: Model<LabProfileDocument>,
        private usersService: UsersService,
    ) {}

    // ========== OBTENIR PROFIL LAB ==========
    async getLabProfile(userId: string): Promise<LabProfileDocument | null> {
        const objectId = new Types.ObjectId(userId);
        return this.labModel.findOne({ userId: objectId }).exec();
    }

    // ========== OBTENIR TOUS LES LABORATOIRES ==========
    async getAllLabs(): Promise<LabProfileDocument[]> {
        // Retourner tous les laboratoires avec toutes leurs informations complètes
        return this.labModel.find()
            .select('-__v')
            .sort({ createdAt: -1 })
            .exec();
    }

    // ========== OBTENIR UN LABORATOIRE PAR ID ==========
    async getLabById(labId: string): Promise<LabProfileDocument> {
        if (!Types.ObjectId.isValid(labId)) {
            throw new NotFoundException('ID de laboratoire invalide');
        }
        const objectId = new Types.ObjectId(labId);
        const lab = await this.labModel.findOne({ _id: objectId })
            .select('-__v')
            .exec();
        
        if (!lab) {
            throw new NotFoundException('Laboratoire non trouvé');
        }
        
        return lab;
    }

    // ========== NORMALISER LES CHAMPS FRONTEND ==========
    private normalizeLabData(data: any): Partial<LabProfile> {
        const normalized: any = { ...data };

        // Alias: name / centre_name → centreName
        if (data.name && !data.centreName) normalized.centreName = data.name;
        if (data.centre_name && !data.centreName) normalized.centreName = data.centre_name;
        delete normalized.name;
        delete normalized.centre_name;

        // Alias: location → localisation
        if (data.location && !data.localisation) normalized.localisation = data.location;
        delete normalized.location;

        // Alias: categories → categorie (toujours un tableau)
        if (data.categories !== undefined && data.categorie === undefined) {
            normalized.categorie = Array.isArray(data.categories)
                ? data.categories
                : typeof data.categories === 'string'
                    ? data.categories.split(',').map((c: string) => c.trim()).filter(Boolean)
                    : [];
        }
        // Normaliser categorie si string unique
        if (typeof normalized.categorie === 'string') {
            normalized.categorie = normalized.categorie.split(',').map((c: string) => c.trim()).filter(Boolean);
        }
        delete normalized.categories;

        // Alias: telephone / tel → phone
        if (data.telephone && !data.phone) normalized.phone = data.telephone;
        if (data.tel && !data.phone) normalized.phone = data.tel;
        delete normalized.telephone;
        delete normalized.tel;

        // Alias: mail → email
        if (data.mail && !data.email) normalized.email = data.mail;
        delete normalized.mail;

        // Alias: is_active → isActive
        if (data.is_active !== undefined && data.isActive === undefined) normalized.isActive = data.is_active;
        delete normalized.is_active;

        return normalized;
    }

    // ========== CRÉER/METTRE À JOUR PROFIL LAB ==========
    async upsertLabProfile(userId: string, data: Partial<LabProfile> | any): Promise<LabProfileDocument> {
        const objectId = new Types.ObjectId(userId);

        // Normaliser les noms de champs envoyés par le frontend
        const normalizedData = this.normalizeLabData(data);

        const profile = await this.labModel.findOneAndUpdate(
            { userId: objectId },
            { ...normalizedData, userId: objectId },
            { upsert: true, new: true }
        ).exec();

        await this.usersService.markProfileCompleted(userId);

        return profile;
    }

    // ========== GESTION DES CATÉGORIES LAB ==========
    async getLabCategories(userId: string): Promise<string[]> {
        const objectId = new Types.ObjectId(userId);
        const profile = await this.labModel.findOne({ userId: objectId }).exec();
        return profile?.categorie || [];
    }

    async addLabCategories(userId: string, categories: string | string[]): Promise<LabProfileDocument> {
        const objectId = new Types.ObjectId(userId);
        const categoriesArray = Array.isArray(categories) ? categories : [categories];

        const profile = await this.labModel.findOne({ userId: objectId }).exec();
        if (!profile) {
            throw new NotFoundException('Profil laboratoire non trouvé');
        }

        // Ajouter les catégories qui n'existent pas déjà
        const existingCategories = profile.categorie || [];
        const newCategories = categoriesArray.filter(cat => !existingCategories.includes(cat));
        const updatedCategories = [...existingCategories, ...newCategories];

        profile.categorie = updatedCategories;
        return profile.save();
    }

    async removeLabCategories(userId: string, categories: string | string[]): Promise<LabProfileDocument> {
        const objectId = new Types.ObjectId(userId);
        const categoriesArray = Array.isArray(categories) ? categories : [categories];

        const profile = await this.labModel.findOne({ userId: objectId }).exec();
        if (!profile) {
            throw new NotFoundException('Profil laboratoire non trouvé');
        }

        // Supprimer les catégories spécifiées
        const existingCategories = profile.categorie || [];
        const updatedCategories = existingCategories.filter(cat => !categoriesArray.includes(cat));

        profile.categorie = updatedCategories;
        return profile.save();
    }

    // ========== RECHERCHER LABS ==========
    async searchLabs(filters: {
        localisation?: string;
        categorie?: string;
        analysisType?: string;
    }): Promise<LabProfileDocument[]> {
        const query: any = {};

        if (filters.localisation) query.localisation = new RegExp(filters.localisation, 'i');
        // Recherche dans le tableau de catégories (MongoDB cherche automatiquement dans tous les éléments du tableau)
        if (filters.categorie) {
            query.categorie = new RegExp(filters.categorie, 'i');
        }

        return this.labModel.find(query)
            .select('-__v')
            .exec();
    }

    // ========== METTRE À JOUR LA PHOTO DE PROFIL ==========
    async updateProfilePhoto(userId: string, profilePhotoPath: string): Promise<LabProfileDocument> {
        const objectId = new Types.ObjectId(userId);
        const profile = await this.labModel.findOneAndUpdate(
            { userId: objectId },
            { profilePhoto: profilePhotoPath },
            { new: true, upsert: false }
        ).exec();

        if (!profile) {
            throw new NotFoundException('Profil laboratoire non trouvé');
        }

        return profile;
    }
}
