import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  async create(@Body() createPrescriptionDto: any, @Request() req) {
    return this.prescriptionsService.create(createPrescriptionDto, req.user.userId);
  }

  @Get('patient/:patientId')
  async getByPatient(@Param('patientId') patientId: string) {
    return this.prescriptionsService.findByPatient(patientId);
  }

  @Get('my-prescriptions')
  async getMyPrescriptions(@Request() req) {
    if (req.user.role === 'patient') {
      return this.prescriptionsService.findByPatient(req.user.userId);
    } else if (req.user.role === 'medecin') {
      return this.prescriptionsService.findByDoctor(req.user.userId);
    }
    return [];
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.prescriptionsService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.prescriptionsService.updateStatus(id, body.status);
  }
}
