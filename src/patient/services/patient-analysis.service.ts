import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PatientAnalysis, PatientAnalysisDocument, AnalysisSource } from '../entities/patient-analysis.entity';

@Injectable()
export class PatientAnalysisService {
    constructor(
        @InjectModel(PatientAnalysis.name)
        private patientAnalysisModel: Model<PatientAnalysisDocument>,
    ) {}

    async create(
        userId: string,
        data: {
            title: string;
            analysisType: string;
            analysisTypeOther?: string;
            analysisDate: Date;
            source: AnalysisSource;
            centreName?: string;
            resultFile: string;
            notes?: string;
        },
    ): Promise<PatientAnalysisDocument> {
        const analysis = new this.patientAnalysisModel({
            userId: new Types.ObjectId(userId),
            ...data,
        });
        return analysis.save();
    }

    async findAllByUserId(userId: string): Promise<PatientAnalysisDocument[]> {
        return this.patientAnalysisModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ analysisDate: -1, createdAt: -1 })
            .exec();
    }

    async findById(id: string, userId?: string): Promise<PatientAnalysisDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('ID invalide');
        }
        const query: any = { _id: new Types.ObjectId(id) };
        if (userId) query.userId = new Types.ObjectId(userId);
        
        const doc = await this.patientAnalysisModel
            .findOne(query)
            .exec();
        if (!doc) {
            throw new NotFoundException('Analyse non trouvée');
        }
        return doc;
    }

    async findAllPending(): Promise<any[]> {
        return this.patientAnalysisModel
            .find({ status: 'en_attente' })
            .populate('userId', 'fullName email gender age allergies')
            .sort({ analysisDate: -1, createdAt: -1 })
            .lean()
            .exec();
    }

    async updateStatusAndAdvice(
        id: string,
        data: {
            status: string;
            aiDiagnosis?: string;
            aiAdvice?: string;
            prescriptionId?: string;
        },
    ): Promise<PatientAnalysisDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('ID invalide');
        }
        
        const updateData: any = { status: data.status };
        if (data.aiDiagnosis) updateData.aiDiagnosis = data.aiDiagnosis;
        if (data.aiAdvice) updateData.aiAdvice = data.aiAdvice;
        if (data.prescriptionId) updateData.prescriptionId = new Types.ObjectId(data.prescriptionId);

        const doc = await this.patientAnalysisModel
            .findByIdAndUpdate(
                new Types.ObjectId(id),
                { $set: updateData },
                { new: true }
            )
            .exec();
            
        if (!doc) {
            throw new NotFoundException('Analyse non trouvée');
        }
        return doc;
    }

    async delete(id: string, userId: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('ID invalide');
        }
        const result = await this.patientAnalysisModel
            .findOneAndDelete({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) })
            .exec();
        if (!result) {
            throw new NotFoundException('Analyse non trouvée');
        }
    }
}
