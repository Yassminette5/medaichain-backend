import {
    Controller,
    Get,
    Put,
    Body,
    Query,
    UseGuards,
    Request,
    Inject,
    forwardRef,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { AuthService } from '../auth/auth.service';
import {
    UpdateDoctorProfileDto,
    UpdateLabProfileDto,
    UpdatePharmacyProfileDto,
    UpdateClinicProfileDto,
    UpdatePatientProfileDto,
} from './dto/update-profile.dto';

@ApiTags('Profils')
@Controller('profiles')
export class ProfilesController {
    constructor(
        private readonly profilesService: ProfilesService,
        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService,
    ) { }

    // ================================================================
    // GET /profiles/me  — Profil complet (user + données métier)
    // ================================================================
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    @ApiOperation({
        summary: 'Obtenir mon profil complet (coordonnées + infos métier)',
        description:
            'Retourne toutes les informations de l\'utilisateur connecté : ' +
            'email, téléphone, rôle, et toutes les données spécifiques à son profil ' +
            '(médecin, centre d\'analyse, pharmacie, clinique ou patient).',
    })
    @ApiResponse({ status: 200, description: 'Profil complet retourné' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    async getMyProfile(@Request() req) {
        // Retourne le profil fusionné (user + profil métier) via AuthService
        return this.authService.getProfile(req.user.userId);
    }

    // ================================================================
    // GET /profiles/me/raw  — Données brutes du profil métier uniquement
    // ================================================================
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me/raw')
    @ApiOperation({
        summary: 'Obtenir les données brutes du profil métier',
        description:
            'Retourne uniquement les données du profil métier (sans infos user) ' +
            'pour pré-remplir un formulaire de modification.',
    })
    @ApiResponse({ status: 200, description: 'Données brutes du profil' })
    async getMyRawProfile(@Request() req) {
        return this.profilesService.getProfile(req.user.userId, req.user.role);
    }

    // ================================================================
    // PUT /profiles/doctor  — Modifier profil médecin
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MEDECIN)
    @ApiBearerAuth()
    @Put('doctor')
    @ApiOperation({
        summary: 'Modifier mon profil médecin',
        description:
            'Met à jour les coordonnées et informations professionnelles du médecin. ' +
            'Tous les champs sont optionnels (seuls ceux envoyés seront mis à jour).',
    })
    @ApiResponse({ status: 200, description: 'Profil mis à jour avec succès' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Rôle médecin requis' })
    async updateDoctorProfile(
        @Request() req,
        @Body() dto: UpdateDoctorProfileDto,
    ) {
        await this.profilesService.upsertDoctorProfile(req.user.userId, dto);
        return this.authService.getProfile(req.user.userId);
    }

    // ================================================================
    // IA CONFIGURATION MÉDECIN
    // ================================================================

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MEDECIN)
    @ApiBearerAuth()
    @Get('doctor/ai-config')
    @ApiOperation({ summary: 'Obtenir l\'URL Ngrok de l\'IA (Médecin)' })
    async getDoctorAiConfig(@Request() req) {
        const profile = await this.profilesService.getProfile(req.user.userId, UserRole.MEDECIN);
        return { url: profile?.aiModelUrl || process.env.KAGGLE_AI_URL };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MEDECIN)
    @ApiBearerAuth()
    @Put('doctor/ai-config')
    @ApiOperation({ summary: 'Enregistrer l\'URL Ngrok de l\'IA en base de données' })
    async updateDoctorAiConfig(@Request() req, @Body('url') url: string) {
        await this.profilesService.upsertDoctorProfile(req.user.userId, { aiModelUrl: url } as any);
        return { message: 'Configuration IA mise à jour en base de données', url };
    }

    // ================================================================
    // PUT /profiles/patient  — Modifier profil patient
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PATIENT)
    @ApiBearerAuth()
    @Put('patient')
    @ApiOperation({
        summary: 'Modifier mon profil patient',
        description:
            'Met à jour les informations médicales du patient : nom, âge, genre, ' +
            'allergies, taille et poids.',
    })
    @ApiResponse({ status: 200, description: 'Profil patient mis à jour' })
    @ApiResponse({ status: 403, description: 'Rôle patient requis' })
    async updatePatientProfile(
        @Request() req,
        @Body() dto: UpdatePatientProfileDto,
    ) {
        await this.profilesService.upsertPatientInformation(req.user.userId, dto);
        return this.authService.getProfile(req.user.userId);
    }

    // ================================================================
    // PUT /profiles/pharmacy  — Modifier profil pharmacie
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PHARMACIE)
    @ApiBearerAuth()
    @Put('pharmacy')
    @ApiOperation({
        summary: 'Modifier mon profil pharmacie',
        description:
            'Met à jour les informations de la pharmacie : nom, adresse, horaires, ' +
            'services, coordonnées GPS et préférences de livraison.',
    })
    @ApiResponse({ status: 200, description: 'Profil pharmacie mis à jour' })
    @ApiResponse({ status: 403, description: 'Rôle pharmacie requis' })
    async updatePharmacyProfile(
        @Request() req,
        @Body() dto: UpdatePharmacyProfileDto,
    ) {
        await this.profilesService.upsertPharmacyProfile(req.user.userId, dto);
        return this.authService.getProfile(req.user.userId);
    }

    // ================================================================
    // PUT /profiles/lab  — Modifier profil centre d'analyse
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Put('lab')
    @ApiOperation({
        summary: 'Modifier mon profil centre d\'analyse',
        description:
            'Met à jour les informations du centre : nom, catégories d\'analyses, ' +
            'localisation, téléphone, isActive et horaires d\'ouverture. ' +
            'Accepte aussi les alias frontend: name/centre_name, location, categories, telephone/tel, mail, is_active.',
    })
    @ApiResponse({ status: 200, description: 'Profil centre d\'analyse mis à jour' })
    @ApiResponse({ status: 403, description: 'Rôle centre_analyse requis' })
    async updateLabProfile(
        @Request() req,
        @Body() dto: UpdateLabProfileDto,
    ) {
        // Normaliser les alias envoyés par le frontend
        const normalized: any = { ...dto };
        if (dto.name && !dto.centreName) normalized.centreName = dto.name;
        if (dto.centre_name && !dto.centreName) normalized.centreName = dto.centre_name;
        if (dto.location && !dto.localisation) normalized.localisation = dto.location;
        if (dto.categories !== undefined && dto.categorie === undefined) {
            normalized.categorie = Array.isArray(dto.categories)
                ? dto.categories
                : String(dto.categories).split(',').map((c: string) => c.trim()).filter(Boolean);
        }
        if (typeof normalized.categorie === 'string') {
            normalized.categorie = normalized.categorie.split(',').map((c: string) => c.trim()).filter(Boolean);
        }
        if (dto.telephone && !dto.phone) normalized.phone = dto.telephone;
        if (dto.tel && !dto.phone) normalized.phone = dto.tel;
        if (dto.mail && !dto.email) normalized.email = dto.mail;
        if (dto.is_active !== undefined && dto.isActive === undefined) normalized.isActive = dto.is_active;
        // Supprimer les alias
        delete normalized.name; delete normalized.centre_name; delete normalized.location;
        delete normalized.categories; delete normalized.telephone; delete normalized.tel;
        delete normalized.mail; delete normalized.is_active;

        await this.profilesService.upsertLabProfile(req.user.userId, normalized);
        return this.authService.getProfile(req.user.userId);
    }

    // ================================================================
    // PUT /profiles/clinic  — Modifier profil clinique
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Put('clinic')
    @ApiOperation({
        summary: 'Modifier mon profil clinique',
        description:
            'Met à jour les informations de la clinique : nom, adresse, spécialités, ' +
            'services, capacité, horaires et assurances acceptées.',
    })
    @ApiResponse({ status: 200, description: 'Profil clinique mis à jour' })
    @ApiResponse({ status: 403, description: 'Rôle clinique requis' })
    async updateClinicProfile(
        @Request() req,
        @Body() dto: UpdateClinicProfileDto,
    ) {
        await this.profilesService.upsertClinicProfile(req.user.userId, dto);
        return this.authService.getProfile(req.user.userId);
    }

    // ================================================================
    // RECHERCHE PUBLIQUE
    // ================================================================
    @Get('doctors/search')
    @ApiOperation({ summary: 'Rechercher des médecins (public)' })
    @ApiQuery({ name: 'speciality', required: false, description: 'Spécialité médicale' })
    @ApiQuery({ name: 'city', required: false, description: 'Ville' })
    @ApiQuery({ name: 'wilaya', required: false, description: 'Wilaya / Gouvernorat' })
    async searchDoctors(
        @Query('speciality') speciality?: string,
        @Query('city') city?: string,
        @Query('wilaya') wilaya?: string,
    ) {
        return this.profilesService.searchDoctors({ speciality, city, wilaya });
    }

    @Get('pharmacies/search')
    @ApiOperation({ summary: 'Rechercher des pharmacies (public)' })
    @ApiQuery({ name: 'city', required: false })
    @ApiQuery({ name: 'wilaya', required: false })
    @ApiQuery({ name: 'is24Hours', required: false })
    @ApiQuery({ name: 'hasDelivery', required: false })
    async searchPharmacies(
        @Query('city') city?: string,
        @Query('wilaya') wilaya?: string,
        @Query('is24Hours') is24Hours?: boolean,
        @Query('hasDelivery') hasDelivery?: boolean,
    ) {
        return this.profilesService.searchPharmacies({ city, wilaya, is24Hours, hasDelivery });
    }

    @Get('labs/search')
    @ApiOperation({ summary: 'Rechercher des centres d\'analyse (public)' })
    @ApiQuery({ name: 'localisation', required: false })
    @ApiQuery({ name: 'categorie', required: false })
    async searchLabs(
        @Query('localisation') localisation?: string,
        @Query('categorie') categorie?: string,
    ) {
        return this.profilesService.searchLabs({ localisation, categorie });
    }

    // ================================================================
    // GET /profiles/patients  — Liste de tous les patients (Gestion)
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.CLINIQUE, UserRole.MEDECIN)
    @ApiBearerAuth()
    @Get('patients')
    @ApiOperation({
        summary: 'Obtenir la liste de tous les patients',
        description: 'Retourne la liste complète des patients enregistrés avec leurs informations de profil et coordonnées.',
    })
    @ApiResponse({ status: 200, description: 'Liste des patients' })
    @ApiResponse({ status: 403, description: 'Accès réservé au staff médical ou admin' })
    async getAllPatients() {
        return this.profilesService.getAllPatients();
    }
}
