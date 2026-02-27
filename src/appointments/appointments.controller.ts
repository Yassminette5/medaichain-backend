import {
    Controller, Get, Post, Put, Delete,
    Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';

@ApiTags('Agenda Personnel')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    @Post()
    @ApiOperation({ summary: 'Créer un événement personnel' })
    async create(@Request() req, @Body() dto: CreateAppointmentDto) {
        return this.appointmentsService.create(req.user.sub, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Lister les événements personnels' })
    async findAll(@Request() req) {
        return this.appointmentsService.findAllForUser(req.user.sub);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Afficher un événement personnel' })
    async findOne(@Request() req, @Param('id') id: string) {
        return this.appointmentsService.findOne(req.user.sub, id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Mettre à jour un événement personnel' })
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
        return this.appointmentsService.update(req.user.sub, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un événement personnel' })
    async remove(@Request() req, @Param('id') id: string) {
        return this.appointmentsService.remove(req.user.sub, id);
    }
}
