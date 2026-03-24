import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { LabAppointmentsService } from './lab-appointments.service';
import { LabService } from '../lab/lab.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { LabAppointment } from './schemas/lab-appointment.schema';

@ApiTags('Rendez-vous Laboratoire / Centre d\'analyse')
@Controller('lab-appointments')
export class LabAppointmentsController {
    constructor(
        private readonly labAppointmentsService: LabAppointmentsService,
        private readonly labService: LabService,
    ) {}

    // ================================================================
    // POST /lab-appointments  —  Prendre un RDV (PATIENT)
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PATIENT)
    @ApiBearerAuth()
    @Post()
    @ApiOperation({
        summary: 'Prendre un rendez-vous dans un centre d\'analyse (patient)',
        description:
            'Crée une demande de rendez-vous (status = pending). ' +
            'Le centre reçoit une notification en temps réel. ' +
            'Champs requis : centreName, analysisType, appointmentDate.',
    })
    @ApiBody({
        schema: {
            example: {
                centreName: 'Laboratoire Alpha',
                analysisType: 'analyse_sanguin',
                appointmentDate: '2026-03-10T09:00:00.000Z',
                hasCurrentTreatment: false,
                hasAllergies: false,
                notes: 'Jeûne de 12h effectué',
            },
        },
    })
    async createAppointment(@Request() req, @Body() data: Partial<LabAppointment>) {
        return this.labAppointmentsService.createAppointment(req.user.userId, data);
    }

    // ================================================================
    // GET /lab-appointments/my  —  Mes RDV (PATIENT)
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PATIENT)
    @ApiBearerAuth()
    @Get('my')
    @ApiOperation({ summary: 'Lister mes rendez-vous dans les centres d\'analyse (patient)' })
    async getMyAppointments(@Request() req) {
        return this.labAppointmentsService.getPatientAppointments(req.user.userId);
    }

    // ================================================================
    // GET /lab-appointments/my/:id  —  Détail d'un RDV (PATIENT)
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PATIENT)
    @ApiBearerAuth()
    @Get('my/:id')
    @ApiOperation({ summary: 'Détails d\'un rendez-vous (patient)' })
    async getMyAppointmentById(@Request() req, @Param('id') id: string) {
        return this.labAppointmentsService.getAppointmentById(id, req.user.userId);
    }

    // ================================================================
    // PUT /lab-appointments/my/:id  —  Modifier un RDV (PATIENT)
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PATIENT)
    @ApiBearerAuth()
    @Put('my/:id')
    @ApiOperation({ summary: 'Modifier un rendez-vous en attente (patient)' })
    async updateMyAppointment(
        @Request() req,
        @Param('id') id: string,
        @Body() data: Partial<LabAppointment>,
    ) {
        return this.labAppointmentsService.updateAppointment(id, req.user.userId, data);
    }

    // ================================================================
    // DELETE /lab-appointments/my/:id  —  Annuler un RDV (PATIENT)
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PATIENT)
    @ApiBearerAuth()
    @Delete('my/:id')
    @ApiOperation({ summary: 'Annuler un rendez-vous (patient)' })
    async cancelMyAppointment(@Request() req, @Param('id') id: string) {
        await this.labAppointmentsService.deleteAppointment(id, req.user.userId);
        return { message: 'Rendez-vous annulé avec succès' };
    }

    // ================================================================
    // GET /lab-appointments/lab/requests  —  Toutes les demandes (LAB)
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Get('lab/requests')
    @ApiOperation({
        summary: 'Voir toutes les demandes de rendez-vous reçues (centre d\'analyse)',
        description: 'Retourne la liste des rendez-vous avec les informations patient enrichies.',
    })
    async getLabRequests(@Request() req) {
        const labProfile = await this.labService.getLabProfile(req.user.userId);
        if (!labProfile?._id) return [];
        return this.labAppointmentsService.getLabAppointments(labProfile._id.toString());
    }

    // ================================================================
    // GET /lab-appointments/lab/requests/:id  —  Détail enrichi (LAB)
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Get('lab/requests/:id')
    @ApiOperation({
        summary: 'Détails complets d\'une demande de rendez-vous (centre d\'analyse)',
        description:
            'Retourne le rendez-vous enrichi avec les informations complètes du patient : ' +
            'fullName, age, gender, allergies, chronicDiseases, height, weight, email, phone. ' +
            'Les champs sont disponibles dans patientInfo et aussi dans patientId pour compatibilité frontend.',
    })
    async getLabRequestDetail(@Request() req, @Param('id') id: string) {
        const labProfile = await this.labService.getLabProfile(req.user.userId);
        if (!labProfile?._id) throw new NotFoundException('Profil laboratoire non trouvé');
        return this.labAppointmentsService.getAppointmentDetails(id, labProfile._id.toString());
    }

    // ================================================================
    // PUT /lab-appointments/lab/:id/accept  —  Accepter (LAB)
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Put('lab/:id/accept')
    @ApiOperation({ summary: 'Accepter une demande de rendez-vous (centre d\'analyse)' })
    async acceptRequest(@Request() req, @Param('id') id: string) {
        const labProfile = await this.labService.getLabProfile(req.user.userId);
        if (!labProfile?._id) throw new NotFoundException('Profil laboratoire non trouvé');
        return this.labAppointmentsService.acceptAppointment(id, labProfile._id.toString());
    }

    // ================================================================
    // PUT /lab-appointments/lab/:id/reject  —  Refuser (LAB)
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Put('lab/:id/reject')
    @ApiOperation({ summary: 'Refuser une demande de rendez-vous (centre d\'analyse)' })
    async rejectRequest(@Request() req, @Param('id') id: string) {
        const labProfile = await this.labService.getLabProfile(req.user.userId);
        if (!labProfile?._id) throw new NotFoundException('Profil laboratoire non trouvé');
        return this.labAppointmentsService.rejectAppointment(id, labProfile._id.toString());
    }

    // ================================================================
    // PUT /lab-appointments/lab/:id/pending  —  Remettre en attente (LAB)
    // ================================================================
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CENTRE_ANALYSE)
    @ApiBearerAuth()
    @Put('lab/:id/pending')
    @ApiOperation({ summary: 'Remettre une demande en attente (centre d\'analyse)' })
    async setPendingRequest(@Request() req, @Param('id') id: string) {
        const labProfile = await this.labService.getLabProfile(req.user.userId);
        if (!labProfile?._id) throw new NotFoundException('Profil laboratoire non trouvé');
        return this.labAppointmentsService.setPendingAppointment(id, labProfile._id.toString());
    }
}
