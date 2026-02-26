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
