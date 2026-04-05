import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Res,
    NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Response } from 'express';
import { existsSync } from 'fs';
import { LabService } from './lab.service';
import { AnalysisResultsService } from './analysis-results.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { AnalysisType } from './schemas/analysis-type.enum';

@ApiTags('Laboratoire / Centre d\'analyse')
@Controller('lab')
export class LabController {
    constructor(
        private readonly labService: LabService,
        private readonly analysisResultsService: AnalysisResultsService,
    ) {}

    // ========== LISTE PUBLIQUE DES LABORATOIRES ==========
    @Get()
    @ApiOperation({ summary: 'Obtenir la liste de tous les laboratoires (vérifiés et non vérifiés) (public)' })
    async getAllLabs() {
        return this.labService.getAllLabs();
    }

    // ========== RECHERCHE PUBLIQUE ==========
    @Get('search')
    @ApiOperation({ summary: 'Rechercher des laboratoires / centres d\'analyse' })
    @ApiQuery({ name: 'localisation', required: false })
    @ApiQuery({ name: 'categorie', required: false })
    async searchLabs(
        @Query('localisation') localisation?: string,
        @Query('categorie') categorie?: string,
    ) {
        return this.labService.searchLabs({ localisation, categorie });
    }

    // ========== PROFIL LAB ==========
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Get('profile')
    @ApiOperation({ 
        summary: 'Obtenir mon profil laboratoire / centre d\'analyse',
        description: 'Endpoint GET pour récupérer les informations complètes du profil du centre d\'analyse connecté. Retourne toutes les données du profil : centreName, categorie, phone, email, localisation, profilePhoto, isVerified, isActive, etc. Si le profil n\'existe pas encore, retourne null.'
    })
    async getLabProfile(@Request() req) {
        return this.labService.getLabProfile(req.user.userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Put('profile')
    @ApiOperation({ 
        summary: 'Créer/Mettre à jour mon profil laboratoire / centre d\'analyse',
        description: 'Endpoint PUT pour créer ou mettre à jour le profil du centre d\'analyse. Permet de définir ou modifier : centreName (nom du centre), categorie (liste des catégories d\'analyse), phone, email, localisation, profilePhoto, isActive, openingHours. Accepte aussi les alias: categories, location, centre_name, telephone, tel, mail, is_active.'
    })
    async updateLabProfile(@Request() req, @Body() data: any) {
        return this.labService.upsertLabProfile(req.user.userId, data);
    }

    // ========== UPLOAD PHOTO DE PROFIL ==========
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Post('profile/photo')
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './uploads/lab-profiles',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    cb(null, `lab-${uniqueSuffix}${ext}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                    return cb(new BadRequestException('Seules les images sont autorisées (jpg, jpeg, png, gif, webp)'), false);
                }
                cb(null, true);
            },
        }),
    )
    @ApiOperation({ 
        summary: 'Uploader une photo de profil pour le centre d\'analyse',
        description: 'Endpoint POST pour uploader une image de profil. Accepte les formats : jpg, jpeg, png, gif, webp. Aucune limite de taille. L\'image sera sauvegardée dans uploads/lab-profiles/ et le chemin sera automatiquement mis à jour dans le profil.'
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image de profil (jpg, jpeg, png, gif, webp, aucune limite de taille)',
                },
            },
        },
    })
    async uploadProfilePhoto(@Request() req, @UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('Aucun fichier fourni');
        }

        const profilePhotoPath = `/uploads/lab-profiles/${file.filename}`;
        const updatedProfile = await this.labService.updateProfilePhoto(req.user.userId, profilePhotoPath);

        return {
            message: 'Photo de profil uploadée avec succès',
            profilePhoto: profilePhotoPath,
            profile: updatedProfile,
        };
    }

    // ========== GESTION DES CATÉGORIES LAB ==========
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Get('categories')
    @ApiOperation({ 
        summary: 'Afficher toutes les catégories du laboratoire',
        description: 'Endpoint GET pour récupérer la liste complète des catégories d\'analyse du centre d\'analyse connecté. Retourne un tableau des catégories (ex: ["Biologie", "Radiologie", "Imagerie", "Sang", "Scanner", etc.]).'
    })
    async getLabCategories(@Request() req) {
        const categories = await this.labService.getLabCategories(req.user.userId);
        return { categories };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Post('categories')
    @ApiOperation({ 
        summary: 'Ajouter une ou plusieurs catégories au laboratoire',
        description: 'Endpoint POST pour ajouter des catégories d\'analyse au centre. Le body doit contenir un champ "categories" qui peut être une chaîne unique ou un tableau de chaînes. Exemple: { "categories": "Biologie" } ou { "categories": ["Biologie", "Radiologie"] }. Les catégories déjà existantes ne seront pas dupliquées.'
    })
    async addLabCategories(@Request() req, @Body() body: { categories: string | string[] }) {
        return this.labService.addLabCategories(req.user.userId, body.categories);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Post('categories/remove')
    @ApiOperation({ 
        summary: 'Supprimer une ou plusieurs catégories du laboratoire',
        description: 'Endpoint POST pour supprimer des catégories d\'analyse du centre.'
    })
    async removeLabCategories(@Request() req, @Body() body: { categories: string | string[] }) {
        return this.labService.removeLabCategories(req.user.userId, body.categories);
    }

    // ========== GESTION DES RÉSULTATS D'ANALYSE ==========
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Post('results')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/analysis-results',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    cb(null, `result-${uniqueSuffix}${ext}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                // Accepter PDF ou image (jpg, jpeg, png, webp)
                const isPdf = file.mimetype === 'application/pdf';
                const isImg = !!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/);
                if (isPdf || isImg) return cb(null, true);
                cb(
                    new BadRequestException('Format non autorisé. Autorisés: PDF, JPG, JPEG, PNG, WEBP.'),
                    false,
                );
            },
        }),
    )
    @ApiOperation({
        summary: 'Uploader un résultat d\'analyse (PDF ou Image)',
        description: 'Endpoint POST pour uploader un résultat d\'analyse. Le formulaire doit contenir: patientName, patientEmail, analysisType, analysisDate, file (PDF ou Image: jpg, jpeg, png, webp), et optionnellement notes et analysisTypeOther.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['patientName', 'patientEmail', 'analysisType', 'analysisDate', 'file'],
            properties: {
                patientName: { type: 'string', description: 'Nom du patient' },
                patientEmail: { type: 'string', description: 'Email du patient' },
                analysisType: { type: 'string', enum: Object.values(AnalysisType), description: 'Type d\'analyse' },
                analysisTypeOther: { type: 'string', description: 'Type d\'analyse si analysisType = AUTRE' },
                analysisDate: { type: 'string', format: 'date', description: 'Date de l\'analyse (YYYY-MM-DD)' },
                file: { type: 'string', format: 'binary', description: 'Fichier de résultat (PDF ou Image: jpg, jpeg, png, webp)' },
                notes: { type: 'string', description: 'Notes optionnelles' },
            },
        },
    })
    async uploadAnalysisResult(
        @Request() req,
        @UploadedFile() file: any,
        @Body() body: {
            patientName: string;
            patientEmail: string;
            analysisType: string;
            analysisTypeOther?: string;
            analysisDate: string;
            notes?: string;
        },
    ) {
        if (!file) {
            throw new BadRequestException('Aucun fichier fourni');
        }

        const labProfile = await this.labService.getLabProfile(req.user.userId);
        if (!labProfile || !labProfile._id) {
            throw new NotFoundException('Profil laboratoire non trouvé');
        }

        const resultFile = `/uploads/analysis-results/${file.filename}`;
        const analysisDate = new Date(body.analysisDate);

        const result = await this.analysisResultsService.createAnalysisResult(labProfile._id.toString(), {
            patientName: body.patientName,
            patientEmail: body.patientEmail,
            analysisType: body.analysisType as AnalysisType,
            analysisTypeOther: body.analysisTypeOther,
            analysisDate: analysisDate,
            resultFile: resultFile,
            notes: body.notes,
        });

        return {
            message: 'Résultat d\'analyse uploadé avec succès',
            result: result,
        };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Get('results')
    @ApiOperation({
        summary: 'Obtenir tous les résultats d\'analyse de mon centre',
        description: 'Endpoint GET pour récupérer tous les résultats d\'analyse uploadés par le centre d\'analyse connecté. Les résultats sont triés par date d\'analyse (plus récent en premier).',
    })
    async getMyAnalysisResults(@Request() req) {
        const labProfile = await this.labService.getLabProfile(req.user.userId);
        if (!labProfile || !labProfile._id) {
            return [];
        }
        return this.analysisResultsService.getLabAnalysisResults(labProfile._id.toString());
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Get('results/search')
    @ApiQuery({ name: 'patientEmail', required: false, description: 'Email du patient pour rechercher ses résultats' })
    @ApiOperation({
        summary: 'Rechercher des résultats d\'analyse par email patient',
        description: 'Endpoint GET pour rechercher les résultats d\'analyse d\'un patient spécifique par son email.',
    })
    async searchResultsByPatient(@Request() req, @Query('patientEmail') patientEmail?: string) {
        const labProfile = await this.labService.getLabProfile(req.user.userId);
        if (!labProfile || !labProfile._id) {
            return [];
        }

        if (!patientEmail) {
            return this.analysisResultsService.getLabAnalysisResults(labProfile._id.toString());
        }

        return this.analysisResultsService.searchResultsByPatient(labProfile._id.toString(), patientEmail);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MEDECIN, UserRole.PATIENT)
    @ApiBearerAuth()
    @Get('results/patient/:patientId')
    @ApiOperation({
        summary: 'Résultats d\'analyse d\'un patient (médecin ou patient)',
        description: 'Pour le médecin : tous les résultats du patient (centre d\'analyse). Pour le patient : uniquement ses propres résultats.',
    })
    async getAnalysisResultsByPatient(@Request() req, @Param('patientId') patientId: string) {
        if (req.user.role === UserRole.PATIENT && req.user.userId !== patientId) {
            throw new NotFoundException('Accès non autorisé');
        }
        return this.analysisResultsService.getAnalysisResultsByPatientId(patientId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Get('results/:id')
    @ApiOperation({
        summary: 'Obtenir un résultat d\'analyse par son ID',
        description: 'Endpoint GET pour récupérer les détails d\'un résultat d\'analyse spécifique par son ID.',
    })
    async getAnalysisResultById(@Request() req, @Param('id') id: string) {
        const labProfile = await this.labService.getLabProfile(req.user.userId);
        if (!labProfile || !labProfile._id) {
            throw new NotFoundException('Profil laboratoire non trouvé');
        }
        return this.analysisResultsService.getAnalysisResultById(id, labProfile._id.toString());
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Post('results/:id/delete')
    @ApiOperation({
        summary: 'Supprimer un résultat d\'analyse',
        description: 'Endpoint POST pour supprimer un résultat d\'analyse par son ID.',
    })
    async deleteAnalysisResult(@Request() req, @Param('id') id: string) {
        const labProfile = await this.labService.getLabProfile(req.user.userId);
        if (!labProfile || !labProfile._id) {
            throw new NotFoundException('Profil laboratoire non trouvé');
        }
        await this.analysisResultsService.deleteAnalysisResult(id, labProfile._id.toString());
        return { message: 'Résultat d\'analyse supprimé avec succès' };
    }

    // ========== SERVIR LES FICHIERS (routes API alternatives) ==========
    @Get('uploads/profiles/:filename')
    @ApiOperation({ 
        summary: 'Servir une image de profil de laboratoire (route API alternative)',
        description: 'Route API alternative pour servir les images de profil. Utilisez cette route si les fichiers statiques ne sont pas accessibles directement. URL: /lab/uploads/profiles/nom-du-fichier.png'
    })
    async getProfileImage(@Param('filename') filename: string, @Res() res: Response) {
        const filePath = join(process.cwd(), 'uploads', 'lab-profiles', filename);
        
        if (!existsSync(filePath)) {
            throw new NotFoundException('Image non trouvée');
        }

        return res.sendFile(filePath);
    }

    @Get('uploads/results/:filename')
    @ApiOperation({ 
        summary: 'Servir un fichier de résultat d\'analyse (PDF ou Image)',
        description: 'Route API alternative pour servir les fichiers de résultats d\'analyse (PDF ou image). URL: /lab/uploads/results/<nom-du-fichier>',
    })
    async getResultFile(@Param('filename') filename: string, @Res() res: Response) {
        const filePath = join(process.cwd(), 'uploads', 'analysis-results', filename);
        
        if (!existsSync(filePath)) {
            throw new NotFoundException('Fichier de résultat non trouvé');
        }

        const lower = filename.toLowerCase();
        if (lower.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
        } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (lower.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (lower.endsWith('.webp')) {
            res.setHeader('Content-Type', 'image/webp');
        } else {
            res.setHeader('Content-Type', 'application/octet-stream');
        }
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        return res.sendFile(filePath);
    }

    // ========== OBTENIR UN LABORATOIRE PAR ID (doit être en dernier) ==========
    @Get(':id')
    @ApiOperation({ summary: 'Obtenir les informations d\'un laboratoire par son ID (public)' })
    async getLabById(@Param('id') id: string) {
        return this.labService.getLabById(id);
    }
}
