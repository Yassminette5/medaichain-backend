import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AnalysisResult, AnalysisResultDocument } from './schemas/analysis-result.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class AnalysisResultsService {
    constructor(
        @InjectModel(AnalysisResult.name) private analysisResultModel: Model<AnalysisResultDocument>,
        private readonly usersService: UsersService,
    ) {}

    // ========== CRÉER UN RÉSULTAT D'ANALYSE ==========
    async createAnalysisResult(
        labId: string,
        data: {
            patientName: string;
            patientEmail: string;
            analysisType: string;
            analysisTypeOther?: string;
            analysisDate: Date;
            resultFile: string;
            notes?: string;
        },
    ): Promise<AnalysisResultDocument> {
        const labObjectId = new Types.ObjectId(labId);

        const analysisResult = new this.analysisResultModel({
            labId: labObjectId,
            patientName: data.patientName,
            patientEmail: data.patientEmail,
            analysisType: data.analysisType,
            analysisTypeOther: data.analysisTypeOther,
            analysisDate: data.analysisDate,
            resultFile: data.resultFile,
            notes: data.notes,
        });

        return analysisResult.save();
    }

    // ========== OBTENIR TOUS LES RÉSULTATS D'UN LABORATOIRE ==========
    async getLabAnalysisResults(labId: string): Promise<AnalysisResultDocument[]> {
        const labObjectId = new Types.ObjectId(labId);
        return this.analysisResultModel
            .find({ labId: labObjectId })
            .select('-__v')
            .sort({ analysisDate: -1, createdAt: -1 })
            .exec();
    }

    // ========== OBTENIR UN RÉSULTAT PAR ID ==========
    async getAnalysisResultById(resultId: string, labId: string): Promise<AnalysisResultDocument> {
        if (!Types.ObjectId.isValid(resultId)) {
            throw new NotFoundException('ID de résultat invalide');
        }

        const resultObjectId = new Types.ObjectId(resultId);
        const labObjectId = new Types.ObjectId(labId);

        const result = await this.analysisResultModel
            .findOne({ _id: resultObjectId, labId: labObjectId })
            .select('-__v')
            .exec();

        if (!result) {
            throw new NotFoundException('Résultat d\'analyse non trouvé');
        }

        return result;
    }

    // ========== SUPPRIMER UN RÉSULTAT ==========
    async deleteAnalysisResult(resultId: string, labId: string): Promise<void> {
        if (!Types.ObjectId.isValid(resultId)) {
            throw new NotFoundException('ID de résultat invalide');
        }

        const resultObjectId = new Types.ObjectId(resultId);
        const labObjectId = new Types.ObjectId(labId);

        const result = await this.analysisResultModel
            .findOneAndDelete({ _id: resultObjectId, labId: labObjectId })
            .exec();

        if (!result) {
            throw new NotFoundException('Résultat d\'analyse non trouvé');
        }
    }

    // ========== RECHERCHER DES RÉSULTATS PAR PATIENT ==========
    async searchResultsByPatient(labId: string, patientEmail: string): Promise<AnalysisResultDocument[]> {
        const labObjectId = new Types.ObjectId(labId);
        return this.analysisResultModel
            .find({
                labId: labObjectId,
                patientEmail: new RegExp(patientEmail, 'i'),
            })
            .select('-__v')
            .sort({ analysisDate: -1 })
            .exec();
    }

    /**
     * Récupère tous les résultats d'analyse d'un patient (par son userId).
     * Utilisé par le médecin (dossier patient) ou le patient (ses propres résultats).
     */
    async getAnalysisResultsByPatientId(patientId: string): Promise<AnalysisResultDocument[]> {
        const user = await this.usersService.findById(patientId);
        const email = (user as any).email;
        if (!email) return [];
        return this.analysisResultModel
            .find({ patientEmail: new RegExp(`^${String(email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
            .populate('labId', 'centreName name')
            .select('-__v')
            .sort({ analysisDate: -1, createdAt: -1 })
            .exec();
    }
}
