import { Controller, Post, Get, Body, UseGuards, Req, UploadedFile, UseInterceptors, Param, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import { PatientAnalysisService } from '../patient/services/patient-analysis.service';
import { DoctorAiService } from './doctor-ai.service';
import { AnalyzeReportDto } from './dto/analyze-report.dto';
import { AnalyzeTextDto } from './dto/analyze-text.dto';
import { CreateAiPrescriptionDto } from './dto/create-ai-prescription.dto';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SubscriptionGuard } from '../subscription/guards/subscription.guard';
import { SubscriptionService } from '../subscription/subscription.service';

@ApiTags('Doctor AI')
@Controller('doctor-ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DoctorAiController {
  constructor(
    private readonly doctorAiService: DoctorAiService,
    private readonly prescriptionsService: PrescriptionsService,
    private readonly patientAnalysisService: PatientAnalysisService,
    private readonly subscriptionService: SubscriptionService,
  ) { }

  @Get('status')
  @Roles(UserRole.MEDECIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Vérifier la disponibilité du modèle IA' })
  async getStatus() {
    return this.doctorAiService.checkModelStatus();
  }

  @Post('analyze')
  @Roles(UserRole.MEDECIN, UserRole.ADMIN)
  @UseGuards(SubscriptionGuard)
  @ApiOperation({ summary: 'Analyser un rapport médical via l\'IA (base64)' })
  async analyze(@Body() analyzeReportDto: AnalyzeReportDto) {
    const { reportImage, context } = analyzeReportDto;
    return this.doctorAiService.analyzeReport(reportImage, context);
  }

  @Post('analyze-text')
  @Roles(UserRole.MEDECIN, UserRole.ADMIN)
  @UseGuards(SubscriptionGuard)
  @ApiOperation({ summary: 'Analyser un rapport médical (texte) via l\'IA' })
  async analyzeText(@Body() analyzeTextDto: AnalyzeTextDto) {
    const { text, context } = analyzeTextDto;
    return this.doctorAiService.analyzeText(text, context);
  }

  @Post('analyze-upload')
  @Roles(UserRole.MEDECIN, UserRole.ADMIN)
  @UseGuards(SubscriptionGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Analyser un rapport médical via upload de fichier' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Image du rapport médical' },
        context: { type: 'string', description: 'Contexte supplémentaire (optionnel)' },
      },
    },
  })
  async analyzeWithUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body('context') context?: string,
  ) {
    if (!file) {
      return { error: 'Aucun fichier uploadé. Envoyez une image du rapport médical.' };
    }

    // Convertir le fichier en base64
    const base64Image = file.buffer.toString('base64');
    const mimeType = file.mimetype || 'image/jpeg';
    const imageBase64 = `data:${mimeType};base64,${base64Image}`;

    return this.doctorAiService.analyzeReport(imageBase64, context);
  }

  @Post('accept-suggestion')
  @Roles(UserRole.MEDECIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Accepter une suggestion d\'IA et créer une ordonnance' })
  async acceptSuggestion(@Body() createAiPrescriptionDto: CreateAiPrescriptionDto, @Req() req: any) {
    const doctorId = req.user.id;
    return this.prescriptionsService.create(createAiPrescriptionDto, doctorId);
  }
  @Get('pending-analyses')
  @Roles(UserRole.MEDECIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Lister les analyses en attente' })
  async getPendingAnalyses() {
    return this.patientAnalysisService.findAllPending();
  }

  @Post('analyze-patient-analysis/:id')
  @Roles(UserRole.MEDECIN, UserRole.ADMIN)
  @UseGuards(SubscriptionGuard)
  @ApiOperation({ summary: 'Analyser une analyse patient spécifique via l\'IA' })
  async analyzePatientAnalysis(@Param('id') id: string, @Body('context') context?: string) {
    console.log(`[DoctorAiController] Demande d'analyse via ID: ${id}`);
    const doc = await this.patientAnalysisService.findById(id);

    if (!doc || !doc.resultFile) {
      console.error(`[DoctorAiController] Erreur: document ou resultFile manquant pour l'ID ${id}`);
       throw new HttpException('Fichier introuvable en Base de Données.', HttpStatus.NOT_FOUND);
    }

    const filePath = path.join(process.cwd(), doc.resultFile);
    if (!fs.existsSync(filePath)) {
      console.error(`[DoctorAiController] ERREUR CRITIQUE 404: Le fichier physique n'existe pas -> ${filePath}`);
      throw new HttpException(`Fichier introuvable sur le serveur à l'adresse: ${filePath}`, HttpStatus.NOT_FOUND);
    }
    const fileBuffer = fs.readFileSync(filePath);

    if (doc.resultFile.toLowerCase().endsWith('.pdf')) {
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(fileBuffer);
      let text = pdfData.text.trim();
      if (!text) text = "Document PDF sans texte interprétable (image scannée ou illisible).";
      return this.doctorAiService.analyzeText(text, context);
    } else {
      const mimeType = doc.resultFile.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      const base64Image = fileBuffer.toString('base64');
      const imageBase64 = `data:${mimeType};base64,${base64Image}`;

      console.log('Transfert de l\'image au service IA pour analyse OCR optimisée');
      return this.doctorAiService.analyzeReport(imageBase64, context);
    }
  }

  @Post('accept-analysis-suggestion/:analysisId')
  @Roles(UserRole.MEDECIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Accepter suggestion IA, créer ordonnance et fermer l\'analyse' })
  async acceptPatientAnalysisSuggestion(
    @Param('analysisId') analysisId: string,
    @Body() body: any,
    @Req() req: any
  ) {
    const doctorId = req.user.id;
    // create prescription if provided
    let prescription = null;
    if (body.createAiPrescriptionDto && Object.keys(body.createAiPrescriptionDto).length > 0) {
      prescription = await this.prescriptionsService.create(body.createAiPrescriptionDto, doctorId);
    }

    // update patient analysis
    const updated = await this.patientAnalysisService.updateStatusAndAdvice(analysisId, {
      status: 'revise',
      aiDiagnosis: body.diagnosis,
      aiAdvice: body.advice,
      prescriptionId: prescription ? prescription._id.toString() : undefined
    });

    return { success: true, prescription, analysis: updated };
  }
}