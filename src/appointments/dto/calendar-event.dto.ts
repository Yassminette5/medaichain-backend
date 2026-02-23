import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { EventType, AlertOption } from '../schemas/calendar-event.schema';

export class CreateCalendarEventDto {
    @ApiProperty({ description: 'Titre de l\'événement' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ description: 'Description / notes' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Date et heure de début (ISO 8601)' })
    @IsDateString()
    @IsNotEmpty()
    dateTime: string;

    @ApiPropertyOptional({ description: 'Date et heure de fin (ISO 8601)' })
    @IsDateString()
    @IsOptional()
    endTime?: string;

    @ApiProperty({ enum: EventType, description: 'Type d\'événement' })
    @IsEnum(EventType)
    type: EventType;

    @ApiProperty({ enum: AlertOption, description: 'Alerte avant l\'événement' })
    @IsEnum(AlertOption)
    @IsOptional()
    alertBefore?: AlertOption;

    @ApiPropertyOptional({ description: 'Nom du patient' })
    @IsString()
    @IsOptional()
    patientName?: string;
}

export class UpdateCalendarEventDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    dateTime?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    endTime?: string;

    @ApiPropertyOptional({ enum: EventType })
    @IsEnum(EventType)
    @IsOptional()
    type?: EventType;

    @ApiPropertyOptional({ enum: AlertOption })
    @IsEnum(AlertOption)
    @IsOptional()
    alertBefore?: AlertOption;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    patientName?: string;
}
