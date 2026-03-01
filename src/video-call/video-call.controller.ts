import { Controller, Get, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { VideoCallService } from './video-call.service';

@ApiTags('Video Call')
@Controller('video-call')
export class VideoCallController {
  constructor(private readonly videoCallService: VideoCallService) {}

  @Get('token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT, UserRole.MEDECIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir un token Agora pour un canal (médecin ou patient)' })
  @ApiQuery({ name: 'channelName', required: true, description: 'Nom du canal (ex: medaichain-{doctorId}-{patientId})' })
  async getToken(@Request() req: any, @Query('channelName') channelName: string) {
    const userId = req.user?.userId ?? req.user?.sub;
    if (!userId) {
      throw new BadRequestException('Utilisateur non identifié');
    }
    if (!channelName || typeof channelName !== 'string' || channelName.trim().length < 3) {
      throw new BadRequestException('channelName requis (ex: medaichain-xxx-yyy)');
    }
    return this.videoCallService.getToken(channelName.trim(), String(userId));
  }
}
