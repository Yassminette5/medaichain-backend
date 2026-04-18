import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Body,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    Req,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PatientAnalysisService } from '../services/patient-analysis.service';
import { AnalysisSource } from '../entities/patient-analysis.entity';

@Controller('patient/analyses')
@UseGuards(JwtAuthGuard)
export class PatientAnalysisController {
    constructor(private readonly patientAnalysisService: PatientAnalysisService) {}

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/patient-analyses',
                filename: (_req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `patient-analysis-${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (_req, file, cb) => {
                const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
                if (!allowedMimeTypes.includes(file.mimetype)) {
                    return cb(
                        new HttpException('Seuls les formats PDF, JPG et PNG sont acceptés.', HttpStatus.BAD_REQUEST),
                        false,
                    );
                }
                cb(null, true);
            },
            limits: { fileSize: 15 * 1024 * 1024 },
        }),
    )
    async uploadAnalysis(
        @UploadedFile() file: Express.Multer.File,
        @Body()
        body: {
            title: string;
            analysisType: string;
            analysisTypeOther?: string;
            analysisDate: string;
            source: string;
            centreName?: string;
            notes?: string;
        },
        @Req() req,
    ) {
        if (!file) {
            throw new HttpException('Aucun fichier fourni', HttpStatus.BAD_REQUEST);
        }

        const userId = req.user?.userId;
        if (!userId) {
            throw new HttpException('Utilisateur non identifié', HttpStatus.UNAUTHORIZED);
        }

        const source =
            body.source === 'centre_analyse'
                ? AnalysisSource.CENTRE_ANALYSE
                : AnalysisSource.PATIENT;

        const result = await this.patientAnalysisService.create(userId, {
            title: body.title || 'Analyse',
            analysisType: body.analysisType || 'autre',
            analysisTypeOther: body.analysisTypeOther,
            analysisDate: new Date(body.analysisDate),
            source,
            centreName: body.centreName,
            resultFile: `/uploads/patient-analyses/${file.filename}`,
            notes: body.notes,
        });

        return {
            message: 'Analyse uploadée avec succès',
            data: result,
        };
    }

    @Get()
    async getMyAnalyses(@Req() req) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new HttpException('Utilisateur non identifié', HttpStatus.UNAUTHORIZED);
        }
        const analyses = await this.patientAnalysisService.findAllByUserId(userId);
        return analyses;
    }

    @Get(':id')
    async getAnalysisById(@Param('id') id: string, @Req() req) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new HttpException('Utilisateur non identifié', HttpStatus.UNAUTHORIZED);
        }
        return this.patientAnalysisService.findById(id, userId);
    }

    @Delete(':id')
    async deleteAnalysis(@Param('id') id: string, @Req() req) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new HttpException('Utilisateur non identifié', HttpStatus.UNAUTHORIZED);
        }
        await this.patientAnalysisService.delete(id, userId);
        return { message: 'Analyse supprimée avec succès' };
    }
}
