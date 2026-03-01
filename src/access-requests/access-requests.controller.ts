import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccessRequestsService } from './access-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CreateAccessRequestDto, RespondAccessRequestDto } from './dto/create-access-request.dto';

@ApiTags('Demandes d\'accès')
@Controller('access-requests')
export class AccessRequestsController {
  constructor(private readonly accessRequestsService: AccessRequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une demande d\'accès (patient)' })
  async create(@Request() req, @Body() dto: CreateAccessRequestDto) {
    return this.accessRequestsService.create(req.user.userId, dto);
  }

  @Get('for-doctor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEDECIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des demandes en attente (médecin)' })
  async getForDoctor(@Request() req) {
    return this.accessRequestsService.findPendingByDoctor(req.user.userId);
  }

  @Get('for-doctor/accepted')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEDECIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des patients dont le médecin a accepté l\'accès (pour dossier et analyses)' })
  async getAcceptedPatientsForDoctor(@Request() req) {
    return this.accessRequestsService.findAcceptedPatientsByDoctor(req.user.userId);
  }

  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEDECIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accepter une demande (médecin)' })
  async accept(@Request() req, @Param('id') id: string, @Body() body: RespondAccessRequestDto) {
    const duration = body.duration || '24 heures';
    return this.accessRequestsService.accept(id, req.user.userId, duration);
  }

  @Patch(':id/refuse')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEDECIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refuser une demande (médecin)' })
  async refuse(@Request() req, @Param('id') id: string) {
    return this.accessRequestsService.refuse(id, req.user.userId);
  }
}
