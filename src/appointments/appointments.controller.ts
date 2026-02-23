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
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto/calendar-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Agenda / Rendez-vous')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MEDECIN)
@ApiBearerAuth()
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    // ========== CRÉER UN ÉVÉNEMENT ==========
    @Post()
    @ApiOperation({ summary: 'Créer un événement dans l\'agenda' })
    async create(@Request() req, @Body() dto: CreateCalendarEventDto) {
        return this.appointmentsService.create(req.user.sub, dto);
    }

    // ========== OBTENIR TOUS MES ÉVÉNEMENTS ==========
    @Get()
    @ApiOperation({ summary: 'Obtenir tous mes événements' })
    async findAll(@Request() req) {
        return this.appointmentsService.findAllByDoctor(req.user.sub);
    }

    // ========== OBTENIR LES ÉVÉNEMENTS PAR MOIS ==========
    @Get('month')
    @ApiOperation({ summary: 'Obtenir les événements d\'un mois spécifique' })
    @ApiQuery({ name: 'year', required: true, type: Number })
    @ApiQuery({ name: 'month', required: true, type: Number })
    async findByMonth(
        @Request() req,
        @Query('year') year: number,
        @Query('month') month: number,
    ) {
        return this.appointmentsService.findByMonth(req.user.sub, +year, +month);
    }

    // ========== OBTENIR UN ÉVÉNEMENT ==========
    @Get(':id')
    @ApiOperation({ summary: 'Obtenir un événement par ID' })
    async findById(@Request() req, @Param('id') id: string) {
        return this.appointmentsService.findById(req.user.sub, id);
    }

    // ========== METTRE À JOUR UN ÉVÉNEMENT ==========
    @Put(':id')
    @ApiOperation({ summary: 'Mettre à jour un événement' })
    async update(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: UpdateCalendarEventDto,
    ) {
        return this.appointmentsService.update(req.user.sub, id, dto);
    }

    // ========== SUPPRIMER UN ÉVÉNEMENT ==========
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un événement' })
    async delete(@Request() req, @Param('id') id: string) {
        await this.appointmentsService.delete(req.user.sub, id);
        return { message: 'Événement supprimé avec succès' };
    }
}
