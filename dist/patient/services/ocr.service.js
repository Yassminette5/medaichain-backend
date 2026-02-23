"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrService = void 0;
const common_1 = require("@nestjs/common");
const pdfkit_1 = __importDefault(require("pdfkit"));
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const auth_service_1 = require("../../auth/auth.service");
const generative_ai_1 = require("@google/generative-ai");
const tesseract_js_1 = __importDefault(require("tesseract.js"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let OcrService = class OcrService {
    ocrDataModel;
    authService;
    genAI;
    textModel;
    constructor(ocrDataModel, authService) {
        this.ocrDataModel = ocrDataModel;
        this.authService = authService;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.textModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
    async onModuleInit() {
        console.log('🚀 OcrService initialized with Tesseract (Local) + Gemini AI (Analysis)');
    }
    async analyzeImage(mediaPath, imageName) {
        try {
            const absolutePath = path.resolve(process.cwd(), mediaPath, imageName);
            if (!fs.existsSync(absolutePath)) {
                throw new Error(`File not found at: ${absolutePath}`);
            }
            console.log('🔍 Running Tesseract on:', imageName);
            const { data: { text: extractedText, confidence } } = await tesseract_js_1.default.recognize(absolutePath, 'eng', { logger: (m) => console.log('Tesseract:', m) });
            console.log(`✅ Tesseract completed. Text length: ${extractedText.length}`);
            console.log('🤖 Analyzing with Gemini AI...');
            const aiAnalysis = await this.analyzeWithAI(extractedText);
            console.log('✅ AI Analysis completed');
            return {
                title: aiAnalysis.title || 'Document Médical',
                description: aiAnalysis.description || '',
                details: {
                    extracted_text: extractedText,
                    confidence_score: confidence,
                    document_type: aiAnalysis.documentType || 'medical_document',
                    processed_at: new Date().toISOString(),
                    medications: aiAnalysis.medications || [],
                    doctor_info: aiAnalysis.doctorInfo || {},
                    patient_advice: aiAnalysis.patientAdvice || '',
                    warnings: aiAnalysis.warnings || [],
                    next_steps: aiAnalysis.nextSteps || [],
                    key_dates: aiAnalysis.keyDates || {},
                },
            };
        }
        catch (error) {
            console.error('Error in analyzeImage:', error);
            throw new common_1.HttpException('Failed to process image. Please ensure the image is clear and readable.', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async analyzeWithAI(ocrText) {
        try {
            const prompt = `Tu es un assistant médical IA. Analyse ce texte OCR d'un document médical et extrais les informations importantes.

Texte OCR:
${ocrText}

Retourne un JSON avec cette structure EXACTE (en français):
{
  "documentType": "prescription" | "lab_report" | "medical_certificate" | "medical_record",
  "title": "titre clair du document",
  "description": "brève description (1-2 phrases)",
  "medications": [
    {
      "name": "nom du médicament",
      "dosage": "dosage (ex: 500mg)",
      "frequency": "fréquence (ex: 2 fois par jour)",
      "duration": "durée (ex: 7 jours)"
    }
  ],
  "doctorInfo": {
    "name": "nom du médecin",
    "specialty": "spécialité",
    "contact": "contact si disponible"
  },
  "patientAdvice": "Conseils simples et rassurants pour le patient (2-3 phrases)",
  "warnings": ["avertissement important 1", "avertissement important 2"],
  "nextSteps": ["étape 1 à suivre", "étape 2 à suivre"],
  "keyDates": {
    "issued": "date d'émission",
    "validUntil": "valide jusqu'à (si applicable)"
  }
}

IMPORTANT:
- Sois rassurant et utilise un langage simple
- Si une information n'est pas disponible, utilise une chaîne vide "" ou un tableau vide []
- Les conseils doivent être encourageants, pas effrayants
- Retourne UNIQUEMENT le JSON, sans texte avant ou après`;
            const result = await this.textModel.generateContent(prompt);
            const response = result.response.text();
            let jsonText = response.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }
            else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\n?/g, '');
            }
            const analysis = JSON.parse(jsonText);
            return analysis;
        }
        catch (error) {
            console.error('Error in AI analysis:', error);
            return {
                documentType: 'medical_document',
                title: 'Document Médical',
                description: 'Document médical analysé',
                medications: [],
                doctorInfo: {},
                patientAdvice: 'Consultez votre médecin pour plus d\'informations.',
                warnings: [],
                nextSteps: [],
                keyDates: {},
            };
        }
    }
    async saveExtractedData(extractedFields, userId, imageName) {
        console.log('Saving OCR data for user:', userId);
        const user = await this.authService.findUserById(userId);
        if (!user) {
            throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
        }
        const ocrData = new this.ocrDataModel({
            ...extractedFields,
            userId: new mongoose_2.Types.ObjectId(userId),
            image_name: imageName,
        });
        return ocrData.save();
    }
    async findAllByUserId(userId) {
        try {
            const objectId = new mongoose_2.Types.ObjectId(userId);
            return await this.ocrDataModel
                .find({ userId: objectId })
                .sort({ createdAt: -1 })
                .exec();
        }
        catch (error) {
            throw new common_1.HttpException('Error retrieving documents', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getImageDetail(ocrDataId) {
        const document = await this.ocrDataModel.findById(ocrDataId).exec();
        if (!document) {
            throw new common_1.HttpException('Document not found', common_1.HttpStatus.NOT_FOUND);
        }
        return document;
    }
    async generatePDFFromOCRData(userId, res) {
        try {
            const ocrData = await this.ocrDataModel.find({ userId: new mongoose_2.Types.ObjectId(userId) }).exec();
            if (!ocrData || ocrData.length === 0) {
                return res.status(404).send('No OCR data found for the user.');
            }
            const user = await this.authService.findUserById(userId);
            const doc = new pdfkit_1.default({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=medical-report.pdf`);
            doc.pipe(res);
            doc.fontSize(20).font('Helvetica-Bold').text(`Medical Report`, { align: 'center' });
            doc.fontSize(12).font('Helvetica').text(`Patient: ${user.email}`, { align: 'center' });
            doc.moveDown(2);
            ocrData.forEach((data, index) => {
                doc.fontSize(14).font('Helvetica-Bold').text(`Document #${index + 1}: ${data.get('title') || 'Untitled'}`);
                doc.moveDown(0.5);
                const obj = data.toObject();
                Object.entries(obj).forEach(([key, value]) => {
                    const skip = ['_id', 'userId', '__v', 'image_name', 'createdAt', 'updatedAt'];
                    if (!skip.includes(key)) {
                        doc.fontSize(10).font('Helvetica-Bold').text(`${key.toUpperCase()}:`, { continued: true });
                        doc.font('Helvetica').text(` ${JSON.stringify(value)}`);
                    }
                });
                if (index < ocrData.length - 1)
                    doc.addPage();
            });
            doc.end();
        }
        catch (error) {
            console.error('PDF Error:', error);
            res.status(500).send('Error generating PDF');
        }
    }
    async deleteImages(ids) {
        try {
            const images = await this.ocrDataModel.find({ _id: { $in: ids } });
            for (const image of images) {
                const filePath = path.resolve(process.cwd(), 'uploads', image.image_name);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            const result = await this.ocrDataModel.deleteMany({ _id: { $in: ids } });
            return result.deletedCount || 0;
        }
        catch (error) {
            throw new common_1.HttpException('Error deleting images', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.OcrService = OcrService;
exports.OcrService = OcrService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)('OCRData')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        auth_service_1.AuthService])
], OcrService);
//# sourceMappingURL=ocr.service.js.map