import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateAccessRequestDto {
  @ApiProperty({ description: 'ID du médecin concerné' })
  @IsString()
  doctorId: string;

  @ApiProperty({ description: 'Motif de la demande d\'accès' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Urgence', enum: ['normal', 'urgent'], default: 'normal' })
  @IsOptional()
  @IsEnum(['normal', 'urgent'])
  urgency?: string;
}

export class RespondAccessRequestDto {
  @ApiPropertyOptional({ description: 'Durée d\'accès accordée (ex: 24 heures)', default: '24 heures' })
  @IsOptional()
  @IsString()
  duration?: string;
}
