import { OnModuleInit } from '@nestjs/common';
import { Response } from 'express';
import { Model, Types } from 'mongoose';
import { OCRData } from '../entities/ocr.entity';
import { AuthService } from '../../auth/auth.service';
export declare class OcrService implements OnModuleInit {
    private ocrDataModel;
    private readonly authService;
    private genAI;
    private textModel;
    constructor(ocrDataModel: Model<OCRData>, authService: AuthService);
    onModuleInit(): Promise<void>;
    analyzeImage(mediaPath: string, imageName: string): Promise<{
        title: any;
        description: any;
        details: {
            extracted_text: string;
            confidence_score: number;
            document_type: any;
            processed_at: string;
            medications: any;
            doctor_info: any;
            patient_advice: any;
            warnings: any;
            next_steps: any;
            key_dates: any;
        };
    }>;
    private analyzeWithAI;
    saveExtractedData(extractedFields: Record<string, any>, userId: string, imageName: string): Promise<import("mongoose").Document<unknown, {}, OCRData, {}, {}> & OCRData & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }>;
    findAllByUserId(userId: string): Promise<(import("mongoose").Document<unknown, {}, OCRData, {}, {}> & OCRData & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    getImageDetail(ocrDataId: string): Promise<import("mongoose").Document<unknown, {}, OCRData, {}, {}> & OCRData & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }>;
    generatePDFFromOCRData(userId: string, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteImages(ids: string[]): Promise<number>;
}
