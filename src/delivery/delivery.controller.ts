import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { DeliveryStatus } from './delivery.schema';

@ApiTags('Livraisons')
@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Créer une livraison' })
  async createDelivery(@Request() req, @Body() data: any) {
    return this.deliveryService.createDelivery({
      ...data,
      pharmacyId: req.user.sub,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'une livraison' })
  async getDelivery(@Param('id') id: string) {
    return this.deliveryService.getDeliveryById(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('tracking/:trackingCode')
  @ApiOperation({ summary: 'Suivre une livraison par code de suivi' })
  async trackDelivery(@Param('trackingCode') trackingCode: string) {
    return this.deliveryService.getDeliveryByTrackingCode(trackingCode);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Get('pharmacy/list')
  @ApiOperation({ summary: 'Obtenir les livraisons de ma pharmacie' })
  async getPharmacyDeliveries(@Request() req) {
    return this.deliveryService.getDeliveriesByPharmacy(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiBearerAuth()
  @Get('patient/list')
  @ApiOperation({ summary: 'Obtenir mes livraisons' })
  async getPatientDeliveries(@Request() req) {
    return this.deliveryService.getDeliveriesByPatient(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Put(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une livraison' })
  async updateDeliveryStatus(
    @Param('id') id: string,
    @Body() data: { status: DeliveryStatus; driverInfo?: any },
  ) {
    return this.deliveryService.updateDeliveryStatus(
      id,
      data.status,
      data.driverInfo,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Put(':id/cancel')
  @ApiOperation({ summary: 'Annuler une livraison' })
  async cancelDelivery(
    @Param('id') id: string,
    @Body() data: { reason: string },
  ) {
    return this.deliveryService.cancelDelivery(id, data.reason);
  }
}
