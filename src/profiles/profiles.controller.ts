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
    Inject,
    forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { AuthService } from '../auth/auth.service';

@ApiTags('Profils')
@Controller('profiles')
export class ProfilesController {
    constructor(
        private readonly profilesService: ProfilesService,
        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService,
    ) { }

    // ========== MON PROFIL ==========
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    @ApiOperation({ summary: 'Obtenir mon profil selon mon rôle' })
    async getMyProfile(@Request() req) {
        return this.profilesService.getProfile(req.user.sub, req.user.role);
    }

    // ========== PROFIL MÉDECIN ==========
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MEDECIN)
    @ApiBearerAuth()
    @Put('doctor')
    @ApiOperation({ summary: 'Créer/Mettre à jour mon profil médecin' })
    async updateDoctorProfile(@Request() req, @Body() data: any) {
        await this.profilesService.upsertDoctorProfile(req.user.sub, data);
        return this.authService.getProfile(req.user.sub);
    }

    // ========== PROFIL PATIENT ==========
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PATIENT)
    @ApiBearerAuth()
    @Put('patient')
    @ApiOperation({ summary: 'Créer/Mettre à jour mon profil patient' })
    async updatePatientProfile(@Request() req, @Body() data: any) {
        await this.profilesService.upsertPatientProfile(req.user.sub, data);
        return this.authService.getProfile(req.user.sub);
    }

    // ========== PROFIL PHARMACIE ==========
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PHARMACIE)
    @ApiBearerAuth()
    @Put('pharmacy')
    @ApiOperation({ summary: 'Créer/Mettre à jour mon profil pharmacie' })
    async updatePharmacyProfile(@Request() req, @Body() data: any) {
        return this.profilesService.upsertPharmacyProfile(req.user.sub, data);
    }

    // ========== PROFIL LAB ==========
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Put('lab')
    @ApiOperation({ summary: 'Créer/Mettre à jour mon profil laboratoire' })
    async updateLabProfile(@Request() req, @Body() data: any) {
        return this.profilesService.upsertLabProfile(req.user.sub, data);
    }

    // ========== PROFIL CLINIQUE ==========
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Put('clinic')
    @ApiOperation({ summary: 'Créer/Mettre à jour mon profil clinique' })
    async updateClinicProfile(@Request() req, @Body() data: any) {
        return this.profilesService.upsertClinicProfile(req.user.sub, data);
    }

    // ========== RECHERCHE PUBLIQUE ==========
    @Get('doctors/search')
    @ApiOperation({ summary: 'Rechercher des médecins' })
    @ApiQuery({ name: 'speciality', required: false })
    @ApiQuery({ name: 'city', required: false })
    @ApiQuery({ name: 'wilaya', required: false })
    async searchDoctors(
        @Query('speciality') speciality?: string,
        @Query('city') city?: string,
        @Query('wilaya') wilaya?: string,
    ) {
        return this.profilesService.searchDoctors({ speciality, city, wilaya });
    }

    @Get('pharmacies/search')
    @ApiOperation({ summary: 'Rechercher des pharmacies' })
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
    @ApiOperation({ summary: 'Rechercher des laboratoires / centres d\'analyse' })
    @ApiQuery({ name: 'localisation', required: false })
    @ApiQuery({ name: 'categorie', required: false })
    async searchLabs(
        @Query('localisation') localisation?: string,
        @Query('categorie') categorie?: string,
    ) {
        return this.profilesService.searchLabs({ localisation, categorie });
    }
}
