import { HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OCRData } from '../entities/ocr.entity';
import { AuthService } from '../../auth/auth.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Tesseract from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OcrService implements OnModuleInit {
    private genAI: GoogleGenerativeAI;
    private textModel: any;

    constructor(
        @InjectModel('OCRData') private ocrDataModel: Model<OCRData>,
        private readonly authService: AuthService,
    ) {
        // Initialize Gemini AI (only for text analysis now)
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.textModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    async onModuleInit() {
        console.log('🚀 OcrService initialized with Tesseract (Local) + Gemini AI (Analysis)');
    }

    /**
     * Analyzes image using Tesseract (Local) + Gemini AI (Analysis)
     * 1. Extracts text using Tesseract (High accuracy, offline)
     * 2. Analyzes with Gemini AI to extract structured medical information
     */
    async analyzeImage(mediaPath: string, imageName: string) {
        try {
            const absolutePath = path.resolve(process.cwd(), mediaPath, imageName);

            if (!fs.existsSync(absolutePath)) {
                throw new Error(`File not found at: ${absolutePath}`);
            }

            // Step 1: Extract text using Tesseract
            console.log('🔍 Running Tesseract on:', imageName);

            // Use Tesseract to recognize text in the image
            const { data: { text: extractedText, confidence } } = await Tesseract.recognize(
                absolutePath,
                'eng', // English language
                { logger: (m) => console.log('Tesseract:', m) },
            );

            console.log(`✅ Tesseract completed. Text length: ${extractedText.length}`);

            // Step 2: Analyze with Gemini AI
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

                    // AI-extracted structured information
                    medications: aiAnalysis.medications || [],
                    doctor_info: aiAnalysis.doctorInfo || {},
                    patient_advice: aiAnalysis.patientAdvice || '',
                    warnings: aiAnalysis.warnings || [],
                    next_steps: aiAnalysis.nextSteps || [],
                    key_dates: aiAnalysis.keyDates || {},
                },
            };
        } catch (error) {
            console.error('Error in analyzeImage:', error);
            throw new HttpException(
                'Failed to process image. Please ensure the image is clear and readable.',
                HttpStatus.BAD_REQUEST,
            );
        }
    }



    /**
     * Analyze OCR text with Gemini AI to extract structured medical information
     */
    private async analyzeWithAI(ocrText: string): Promise<any> {
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

            // Extract JSON from response (remove markdown code blocks if present)
            let jsonText = response.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\n?/g, '');
            }

            const analysis = JSON.parse(jsonText);
            return analysis;
        } catch (error) {
            console.error('Error in AI analysis:', error);
            // Return basic structure if AI fails
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
    async saveExtractedData(extractedFields: Record<string, any>, userId: string, imageName: string) {
        console.log('Saving OCR data for user:', userId);
        const user = await this.authService.findUserById(userId);

        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        // Support both flat payload or { data: {...} }
        const dataPayload = extractedFields?.data ?? extractedFields ?? {};

        const ocrData = new this.ocrDataModel({
            // Champs de base
            userId: new Types.ObjectId(userId),
            image_name: imageName,
            // Valeurs par défaut si non fournies
            title: dataPayload.title || extractedFields.title || 'Document Médical',
            description: dataPayload.description || extractedFields.description || '',
            // Champs optionnels normalisés
            sourceType: dataPayload.sourceType || extractedFields.sourceType || 'patient',
            mimeType: dataPayload.mimeType || extractedFields.mimeType,
            // Conserver tout le résultat structuré si fourni
            result: dataPayload.result || dataPayload,
            // Conserver le reste du payload pour compat desc (strict:false)
            ...dataPayload,
        });

        return ocrData.save();
    }

    async findAllByUserId(userId: string) {
        try {
            const objectId = new Types.ObjectId(userId);
            return await this.ocrDataModel
                .find({ userId: objectId })
                .sort({ createdAt: -1 })
                .exec();
        } catch (error) {
            throw new HttpException('Error retrieving documents', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getImageDetail(ocrDataId: string) {
        const document = await this.ocrDataModel.findById(ocrDataId).exec();
        if (!document) {
            throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
        }
        return document;
    }

    async generatePDFFromOCRData(userId: string, res: Response) {
        try {
            const ocrData = await this.ocrDataModel.find({ userId: new Types.ObjectId(userId) }).exec();
            if (!ocrData || ocrData.length === 0) {
                return res.status(404).send('No OCR data found for the user.');
            }

            const user = await this.authService.findUserById(userId);
            const doc = new PDFDocument({ margin: 50 });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=medical-report.pdf`);

            doc.pipe(res);

            // PDF Header
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

                if (index < ocrData.length - 1) doc.addPage();
            });

            doc.end();
        } catch (error) {
            console.error('PDF Error:', error);
            res.status(500).send('Error generating PDF');
        }
    }

    async deleteImages(ids: string[]): Promise<number> {
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
        } catch (error) {
            throw new HttpException('Error deleting images', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}