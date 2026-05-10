import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';

@ApiTags('Agenda / Rendez-vous')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    // ========== CRÉER UN ÉVÉNEMENT ==========
    @Post()
    @Roles(UserRole.MEDECIN, UserRole.PATIENT)
    @ApiOperation({ summary: 'Créer un événement dans l\'agenda (médecin ou patient)' })
    async create(@Request() req, @Body() dto: CreateAppointmentDto) {
        return this.appointmentsService.create(req.user.userId, dto);
    }

    // ========== OBTENIR TOUS LES ÉVÉNEMENTS (DÉPEND DU RÔLE) ==========
    @Get()
    @Roles(UserRole.MEDECIN, UserRole.PATIENT)
    @ApiOperation({ summary: 'Obtenir tous mes événements' })
    async findAll(@Request() req) {
        if (req.user.role === UserRole.PATIENT) {
            return this.appointmentsService.findAllByPatient(req.user.userId);
        }
        return this.appointmentsService.findAllByDoctor(req.user.userId);
    }

    // ========== OBTENIR LES ÉVÉNEMENTS PAR MOIS (MÉDECIN) ==========
    @Get('month')
    @Roles(UserRole.MEDECIN)
    @ApiOperation({ summary: 'Obtenir les événements d\'un mois spécifique (médecin)' })
    @ApiQuery({ name: 'year', required: true, type: Number, description: 'Année (ex: 2025)' })
    @ApiQuery({ name: 'month', required: true, type: Number, description: 'Mois (1-12)' })
    async findByMonth(
        @Request() req,
        @Query('year') year: number,
        @Query('month') month: number,
    ) {
        return this.appointmentsService.findByMonth(req.user.userId, +year, +month);
    }

    // ========== OBTENIR UN ÉVÉNEMENT PAR ID ==========
    @Get(':id')
    @Roles(UserRole.MEDECIN, UserRole.PATIENT)
    @ApiOperation({ summary: 'Obtenir un événement par ID' })
    async findOne(@Request() req, @Param('id') id: string) {
        // Pour l'instant on garde la logique existante qui cherche par doctorId (userId)
        // Mais on pourrait l'adapter si besoin
        return this.appointmentsService.findById(req.user.userId, id);
    }

    // ========== METTRE À JOUR UN ÉVÉNEMENT ==========
    @Put(':id')
    @Roles(UserRole.MEDECIN)
    @ApiOperation({ summary: 'Mettre à jour un événement' })
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
        return this.appointmentsService.update(req.user.userId, id, dto);
    }

    // ========== SUPPRIMER UN ÉVÉNEMENT ==========
    @Delete(':id')
    @Roles(UserRole.MEDECIN)
    @ApiOperation({ summary: 'Supprimer un événement' })
    async remove(@Request() req, @Param('id') id: string) {
        await this.appointmentsService.remove(req.user.userId, id);
        return { message: 'Événement supprimé avec succès' };
    }
}
