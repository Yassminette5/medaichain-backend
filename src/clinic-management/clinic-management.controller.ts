import {
    Controller, Get, Post, Put, Delete,
    Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ClinicManagementService } from './clinic-management.service';
import { ProfilesService } from '../profiles/profiles.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CreateClinicDto, UpdateClinicDto } from './dto/clinic.dto';
import { AddDoctorToClinicDto, UpdateClinicDoctorDto } from './dto/clinic-doctor.dto';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';
import { CreateAdmissionDto, UpdateAdmissionDto } from './dto/admission.dto';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from './dto/medical-record.dto';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { UpdateClinicProfileDto } from './dto/clinic-profile.dto';

@ApiTags('Gestion Clinique')
@Controller('clinic-management')
export class ClinicManagementController {
    constructor(
        private readonly service: ClinicManagementService,
        private readonly profilesService: ProfilesService,
        private readonly authService: AuthService,
    ) { }

    // ==========================================
    //      PROFIL CLINIQUE (après invitation admin)
    // ==========================================

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Get('profile')
    @ApiOperation({
        summary: 'Obtenir mon profil clinique complet',
        description:
            'Retourne le profil complet de la clinique connectée (coordonnées, spécialités, services, etc.). ' +
            'Utilisé pour pré-remplir le formulaire de modification.',
    })
    async getMyProfile(@Request() req) {
        return this.authService.getProfile(req.user.userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Get('profile/raw')
    @ApiOperation({
        summary: 'Obtenir les données brutes du profil clinique (pour formulaire)',
        description: 'Retourne uniquement les données du profil métier pour pré-remplir un formulaire.',
    })
    async getMyRawProfile(@Request() req) {
        return this.profilesService.getProfile(req.user.userId, UserRole.CLINIQUE);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Put('profile')
    @ApiOperation({
        summary: 'Créer / Mettre à jour mon profil clinique',
        description:
            'Crée ou met à jour le profil de la clinique connectée. ' +
            'Tous les champs sont optionnels (seuls ceux envoyés seront mis à jour). ' +
            'Champs principaux : clinicName, directorName, licenseNumber, address, city, wilaya, ' +
            'specialities, services, bedCount, hasEmergency, hasAmbulance, insuranceAccepted, ' +
            'workingDays, openingTime, closingTime.',
    })
    @ApiBody({
        schema: {
            example: {
                clinicName: 'Clinique El Afia',
                directorName: 'Dr. Ahmed Benali',
                licenseNumber: 'AGR-2025-001',
                address: '12 Rue Didouche Mourad, Alger',
                city: 'Alger',
                wilaya: 'Alger',
                specialities: ['Cardiologie', 'Chirurgie'],
                services: ['Urgences', 'Radiologie'],
                bedCount: 50,
                hasEmergency: true,
                hasAmbulance: true,
                insuranceAccepted: ['CNAS', 'CASNOS'],
                workingDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
                openingTime: '08:00',
                closingTime: '17:00',
            },
        },
    })
    async updateMyProfile(@Request() req, @Body() dto: UpdateClinicProfileDto) {
        await this.profilesService.upsertClinicProfile(req.user.userId, dto);
        return this.authService.getProfile(req.user.userId);
    }

    // ==========================================
    //   ENDPOINTS "MY" — résolution auto de la clinique
    //   (pas besoin de connaître le clinicId)
    // ==========================================

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Get('my')
    @ApiOperation({
        summary: 'Obtenir ma clinique (créée automatiquement si absente)',
        description:
            'Retourne le document Clinic du user connecté. ' +
            'Si aucune clinique n\'existe encore (premier accès après invitation), ' +
            'elle est créée automatiquement à partir du profil.',
    })
    async getMyClinicAuto(@Request() req) {
        return this.service.getOrCreateClinicByOwner(req.user.userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Post('my/doctors')
    @ApiOperation({ summary: 'Ajouter un médecin à MA clinique (résolution automatique)' })
    async addDoctorToMyClinic(@Request() req, @Body() dto: AddDoctorToClinicDto) {
        const clinic = await this.service.getOrCreateClinicByOwner(req.user.userId);
        return this.service.addDoctorToClinic(clinic._id.toString(), dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Get('my/doctors')
    @ApiOperation({ summary: 'Lister les médecins de MA clinique' })
    async getMyDoctors(@Request() req) {
        const clinic = await this.service.getOrCreateClinicByOwner(req.user.userId);
        return this.service.getDoctorsByClinic(clinic._id.toString());
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Get('my/appointments')
    @ApiOperation({ summary: 'Lister les rendez-vous de MA clinique' })
    @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD' })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'doctorId', required: false })
    @ApiQuery({ name: 'source', required: false })
    async getMyAppointments(
        @Request() req,
        @Query('date') date?: string,
        @Query('status') status?: string,
        @Query('doctorId') doctorId?: string,
        @Query('source') source?: string,
    ) {
        const clinic = await this.service.getOrCreateClinicByOwner(req.user.userId);
        return this.service.getAppointmentsByClinic(clinic._id.toString(), { date, status, doctorId, source });
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Post('my/appointments')
    @ApiOperation({ summary: 'Créer un rendez-vous dans MA clinique' })
    async createMyAppointment(@Request() req, @Body() dto: CreateAppointmentDto) {
        const clinic = await this.service.getOrCreateClinicByOwner(req.user.userId);
        return this.service.createAppointment(clinic._id.toString(), dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Get('my/admissions')
    @ApiOperation({ summary: 'Lister les admissions de MA clinique' })
    @ApiQuery({ name: 'date', required: false })
    @ApiQuery({ name: 'status', required: false })
    async getMyAdmissions(
        @Request() req,
        @Query('date') date?: string,
        @Query('status') status?: string,
    ) {
        const clinic = await this.service.getOrCreateClinicByOwner(req.user.userId);
        return this.service.getAdmissionsByClinic(clinic._id.toString(), { date, status });
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Post('my/admissions')
    @ApiOperation({ summary: 'Admettre un patient dans MA clinique' })
    async createMyAdmission(@Request() req, @Body() dto: CreateAdmissionDto) {
        const clinic = await this.service.getOrCreateClinicByOwner(req.user.userId);
        return this.service.createAdmission(clinic._id.toString(), dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE, UserRole.MEDECIN)
    @ApiBearerAuth()
    @Get('my/medical-records')
    @ApiOperation({ summary: 'Lister les dossiers médicaux de MA clinique (propriétaire ou médecin)' })
    @ApiQuery({ name: 'patientId', required: false })
    @ApiQuery({ name: 'doctorId', required: false })
    @ApiQuery({ name: 'type', required: false })
    async getMyMedicalRecords(
        @Request() req,
        @Query('patientId') patientId?: string,
        @Query('doctorId') doctorId?: string,
        @Query('type') type?: string,
    ) {
        const clinic = await this.service.getClinicForUser(req.user.userId, req.user.role);
        return this.service.getMedicalRecordsByClinic(clinic._id.toString(), { patientId, doctorId, type });
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Get('my/invoices')
    @ApiOperation({ summary: 'Lister les factures de MA clinique' })
    @ApiQuery({ name: 'paymentStatus', required: false })
    @ApiQuery({ name: 'patientId', required: false })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    async getMyInvoices(
        @Request() req,
        @Query('paymentStatus') paymentStatus?: string,
        @Query('patientId') patientId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const clinic = await this.service.getOrCreateClinicByOwner(req.user.userId);
        return this.service.getInvoicesByClinic(clinic._id.toString(), { paymentStatus, patientId, startDate, endDate });
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE, UserRole.MEDECIN)
    @ApiBearerAuth()
    @Get('my/dashboard')
    @ApiOperation({ summary: 'Tableau de bord de MA clinique (propriétaire ou médecin)' })
    async getMyDashboard(@Request() req) {
        const clinic = await this.service.getClinicForUser(req.user.userId, req.user.role);
        return this.service.getDashboardStats(clinic._id.toString());
    }

    // ==========================================
    //              CLINIC CRUD
    // ==========================================

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Post('clinic')
    @ApiOperation({ summary: 'Créer une clinique (gestion interne)' })
    async createClinic(@Request() req, @Body() dto: CreateClinicDto) {
        return this.service.createClinic(req.user.userId, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Get('clinic/mine')
    @ApiOperation({ summary: 'Obtenir ma clinique (gestion interne)' })
    async getMyClinic(@Request() req) {
        return this.service.getClinicByOwner(req.user.userId);
    }

    @Get('clinics')
    @ApiOperation({ summary: 'Obtenir toutes les cliniques (public)' })
    async getAllClinics() {
        return this.service.getAllClinics();
    }

    @Get('clinic/:id')
    @ApiOperation({ summary: 'Obtenir une clinique par ID (public)' })
    async getClinicById(@Param('id') id: string) {
        return this.service.getClinicById(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Put('clinic/:id')
    @ApiOperation({ summary: 'Mettre à jour une clinique' })
    async updateClinic(@Param('id') id: string, @Body() dto: UpdateClinicDto) {
        return this.service.updateClinic(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Delete('clinic/:id')
    @ApiOperation({ summary: 'Supprimer une clinique' })
    async deleteClinic(@Param('id') id: string) {
        return this.service.deleteClinic(id);
    }

    // ==========================================
    //         DOCTORS (liés à la clinique)
    // ==========================================

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('doctors/available')
    @ApiOperation({ summary: 'Lister tous les médecins disponibles pour la clinique' })
    async getAvailableDoctors() {
        return this.service.getAvailableDoctors();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Post('clinic/:clinicId/doctors')
    @ApiOperation({ summary: 'Ajouter un médecin à la clinique' })
    async addDoctor(@Param('clinicId') clinicId: string, @Body() dto: AddDoctorToClinicDto) {
        return this.service.addDoctorToClinic(clinicId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('clinic/:clinicId/doctors')
    @ApiOperation({ summary: 'Lister les médecins de la clinique' })
    async getDoctors(@Param('clinicId') clinicId: string) {
        return this.service.getDoctorsByClinic(clinicId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Put('doctors/:clinicDoctorId')
    @ApiOperation({ summary: 'Modifier un médecin dans la clinique' })
    async updateDoctor(@Param('clinicDoctorId') id: string, @Body() dto: UpdateClinicDoctorDto) {
        return this.service.updateClinicDoctor(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Delete('doctors/:clinicDoctorId')
    @ApiOperation({ summary: 'Retirer un médecin de la clinique' })
    async removeDoctor(@Param('clinicDoctorId') id: string) {
        return this.service.removeDoctorFromClinic(id);
    }

    // ==========================================
    //         APPOINTMENTS (Rendez-vous)
    // ==========================================

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Post('clinic/:clinicId/appointments')
    @ApiOperation({ summary: 'Créer un rendez-vous (par la clinique)' })
    async createAppointment(@Param('clinicId') clinicId: string, @Body() dto: CreateAppointmentDto) {
        return this.service.createAppointment(clinicId, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PATIENT)
    @ApiBearerAuth()
    @Post('clinic/:clinicId/book-appointment')
    @ApiOperation({ summary: 'Prendre un rendez-vous (par le patient)' })
    async bookAppointmentPatient(@Request() req, @Param('clinicId') clinicId: string, @Body() body: any) {
        const dto = new CreateAppointmentDto();
        dto.patientId = req.user.userId;
        dto.patientName = body.patientName || req.user.email;
        dto.date = body.date || new Date().toISOString();
        dto.timeSlot = body.timeSlot || '09:00 - 09:30';
        dto.reason = body.reason || 'Réservation mobile';
        dto.source = 'mobile';
        // optionnel: pas de doctorId car c'est un patient qui reserve
        return this.service.createAppointment(clinicId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('clinic/:clinicId/appointments')
    @ApiOperation({ summary: 'Lister les rendez-vous de la clinique' })
    @ApiQuery({ name: 'date', required: false, description: 'Filtrer par date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'status', required: false, description: 'Filtrer par statut' })
    @ApiQuery({ name: 'doctorId', required: false, description: 'Filtrer par médecin' })
    @ApiQuery({ name: 'source', required: false })
    async getAppointments(
        @Param('clinicId') clinicId: string,
        @Query('date') date?: string,
        @Query('status') status?: string,
        @Query('doctorId') doctorId?: string,
        @Query('source') source?: string,
    ) {
        return this.service.getAppointmentsByClinic(clinicId, { date, status, doctorId, source });
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('appointments/:id')
    @ApiOperation({ summary: 'Détail d\'un rendez-vous' })
    async getAppointment(@Param('id') id: string) {
        return this.service.getAppointmentById(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Put('appointments/:id')
    @ApiOperation({ summary: 'Modifier un rendez-vous' })
    async updateAppointment(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
        return this.service.updateAppointment(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Delete('appointments/:id')
    @ApiOperation({ summary: 'Supprimer un rendez-vous' })
    async deleteAppointment(@Param('id') id: string) {
        return this.service.deleteAppointment(id);
    }

    // ==========================================
    //         ADMISSIONS (Réception)
    // ==========================================

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Post('clinic/:clinicId/admissions')
    @ApiOperation({ summary: 'Admettre un patient (réception)' })
    async createAdmission(@Param('clinicId') clinicId: string, @Body() dto: CreateAdmissionDto) {
        return this.service.createAdmission(clinicId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('clinic/:clinicId/admissions')
    @ApiOperation({ summary: 'Lister les admissions du jour' })
    @ApiQuery({ name: 'date', required: false })
    @ApiQuery({ name: 'status', required: false })
    async getAdmissions(
        @Param('clinicId') clinicId: string,
        @Query('date') date?: string,
        @Query('status') status?: string,
    ) {
        return this.service.getAdmissionsByClinic(clinicId, { date, status });
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Put('admissions/:id')
    @ApiOperation({ summary: 'Modifier une admission' })
    async updateAdmission(@Param('id') id: string, @Body() dto: UpdateAdmissionDto) {
        return this.service.updateAdmission(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Delete('admissions/:id')
    @ApiOperation({ summary: 'Supprimer une admission' })
    async deleteAdmission(@Param('id') id: string) {
        return this.service.deleteAdmission(id);
    }

    // ==========================================
    //    DOSSIERS MÉDICAUX (Medical Records)
    // ==========================================

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Post('clinic/:clinicId/medical-records')
    @ApiOperation({ summary: 'Créer un dossier médical / consultation' })
    async createMedicalRecord(@Param('clinicId') clinicId: string, @Body() dto: CreateMedicalRecordDto) {
        return this.service.createMedicalRecord(clinicId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('clinic/:clinicId/medical-records')
    @ApiOperation({ summary: 'Lister les dossiers médicaux de la clinique' })
    @ApiQuery({ name: 'patientId', required: false })
    @ApiQuery({ name: 'doctorId', required: false })
    @ApiQuery({ name: 'type', required: false, description: 'consultation, analyse, chirurgie, urgence, suivi, vaccination' })
    async getMedicalRecords(
        @Param('clinicId') clinicId: string,
        @Query('patientId') patientId?: string,
        @Query('doctorId') doctorId?: string,
        @Query('type') type?: string,
    ) {
        return this.service.getMedicalRecordsByClinic(clinicId, { patientId, doctorId, type });
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('medical-records/:id')
    @ApiOperation({ summary: 'Détail d\'un dossier médical' })
    async getMedicalRecord(@Param('id') id: string) {
        return this.service.getMedicalRecordById(id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('patient/:patientId/medical-history')
    @ApiOperation({ summary: 'Historique médical complet d\'un patient (toutes cliniques)' })
    async getPatientHistory(@Param('patientId') patientId: string) {
        return this.service.getPatientMedicalHistory(patientId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Put('medical-records/:id')
    @ApiOperation({ summary: 'Modifier un dossier médical' })
    async updateMedicalRecord(@Param('id') id: string, @Body() dto: UpdateMedicalRecordDto) {
        return this.service.updateMedicalRecord(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Delete('medical-records/:id')
    @ApiOperation({ summary: 'Supprimer un dossier médical' })
    async deleteMedicalRecord(@Param('id') id: string) {
        return this.service.deleteMedicalRecord(id);
    }

    // ==========================================
    //         FACTURATION (Invoices)
    // ==========================================

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Post('clinic/:clinicId/invoices')
    @ApiOperation({ summary: 'Créer une facture' })
    async createInvoice(@Param('clinicId') clinicId: string, @Body() dto: CreateInvoiceDto) {
        return this.service.createInvoice(clinicId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('clinic/:clinicId/invoices')
    @ApiOperation({ summary: 'Lister les factures de la clinique' })
    @ApiQuery({ name: 'paymentStatus', required: false, description: 'pending, paid, partial' })
    @ApiQuery({ name: 'patientId', required: false })
    @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD' })
    @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD' })
    async getInvoices(
        @Param('clinicId') clinicId: string,
        @Query('paymentStatus') paymentStatus?: string,
        @Query('patientId') patientId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.service.getInvoicesByClinic(clinicId, { paymentStatus, patientId, startDate, endDate });
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('invoices/:id')
    @ApiOperation({ summary: 'Détail d\'une facture' })
    async getInvoice(@Param('id') id: string) {
        return this.service.getInvoiceById(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Put('invoices/:id')
    @ApiOperation({ summary: 'Modifier une facture / Enregistrer un paiement' })
    async updateInvoice(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
        return this.service.updateInvoice(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLINIQUE)
    @ApiBearerAuth()
    @Delete('invoices/:id')
    @ApiOperation({ summary: 'Supprimer une facture' })
    async deleteInvoice(@Param('id') id: string) {
        return this.service.deleteInvoice(id);
    }

    // ==========================================
    //        DASHBOARD PROFESSIONNEL
    // ==========================================

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('clinic/:clinicId/dashboard')
    @ApiOperation({ summary: 'Tableau de bord (KPIs, finances, analytics, activité récente)' })
    async getDashboard(@Param('clinicId') clinicId: string) {
        return this.service.getDashboardStats(clinicId);
    }
}
