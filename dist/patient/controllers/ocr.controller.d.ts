import { OcrService } from '../services/ocr.service';
import { DeleteDocumentsDto } from '../dto/ocr.dto';
import { Response } from 'express';
export declare class OcrController {
    private readonly ocrService;
    constructor(ocrService: OcrService);
    uploadDocument(file: Express.Multer.File, req: any): Promise<{
        message: string;
        data: {
            filename: string;
            userId: any;
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
        };
    }>;
    saveDocument(body: any, req: any): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("../entities/ocr.entity").OCRData, {}, {}> & import("../entities/ocr.entity").OCRData & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    getAllDocuments(req: any): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, import("../entities/ocr.entity").OCRData, {}, {}> & import("../entities/ocr.entity").OCRData & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    getDocumentDetail(id: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("../entities/ocr.entity").OCRData, {}, {}> & import("../entities/ocr.entity").OCRData & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    }>;
    deleteDocuments(deleteDto: DeleteDocumentsDto): Promise<{
        message: string;
        deletedCount: number;
    }>;
    exportToPdf(req: any, res: Response): Promise<void>;
}
