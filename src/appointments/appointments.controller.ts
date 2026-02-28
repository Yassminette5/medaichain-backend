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

@ApiTags('Agenda / Rendez-vous Médecin')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MEDECIN)
@ApiBearerAuth()
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    // ========== CRÉER UN ÉVÉNEMENT ==========
    @Post()
    @ApiOperation({ summary: 'Créer un événement dans l\'agenda du médecin' })
    async create(@Request() req, @Body() dto: CreateAppointmentDto) {
        return this.appointmentsService.create(req.user.userId, dto);
    }

    // ========== OBTENIR TOUS MES ÉVÉNEMENTS ==========
    @Get()
    @ApiOperation({ summary: 'Obtenir tous mes événements' })
    async findAll(@Request() req) {
        return this.appointmentsService.findAllByDoctor(req.user.userId);
    }

    // ========== OBTENIR LES ÉVÉNEMENTS PAR MOIS ==========
    @Get('month')
    @ApiOperation({ summary: 'Obtenir les événements d\'un mois spécifique' })
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
    @ApiOperation({ summary: 'Obtenir un événement par ID' })
    async findOne(@Request() req, @Param('id') id: string) {
        return this.appointmentsService.findById(req.user.userId, id);
    }

    // ========== METTRE À JOUR UN ÉVÉNEMENT ==========
    @Put(':id')
    @ApiOperation({ summary: 'Mettre à jour un événement' })
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
        return this.appointmentsService.update(req.user.userId, id, dto);
    }

    // ========== SUPPRIMER UN ÉVÉNEMENT ==========
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un événement' })
    async remove(@Request() req, @Param('id') id: string) {
        await this.appointmentsService.remove(req.user.userId, id);
        return { message: 'Événement supprimé avec succès' };
    }
}
