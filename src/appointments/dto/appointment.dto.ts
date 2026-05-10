import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum EventType {
    CONSULTATION = 'consultation',
    OPERATION = 'operation',
    NOTE = 'note',
}

export enum AlertOption {
    NONE = 'none',
    MIN_5 = 'min5',
    MIN_15 = 'min15',
    MIN_30 = 'min30',
    HOUR_1 = 'hour1',
    DAY_1 = 'day1',
}

export class CreateAppointmentDto {
    @ApiProperty({ description: 'Titre de l\'événement' })
    @IsString()
    title: string;

    @ApiPropertyOptional({ description: 'Description / notes' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Date et heure de début (ISO 8601)' })
    @IsDateString()
    dateTime: string;

    @ApiPropertyOptional({ description: 'Date et heure de fin (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    endTime?: string;

    @ApiProperty({
        enum: EventType,
        description: 'Type d\'événement: consultation, operation, note',
        example: EventType.CONSULTATION,
    })
    @IsEnum(EventType)
    type: EventType;

    @ApiPropertyOptional({
        enum: AlertOption,
        description: 'Alerte avant l\'événement',
        example: AlertOption.MIN_15,
    })
    @IsOptional()
    @IsEnum(AlertOption)
    alertBefore?: AlertOption;

    @ApiPropertyOptional({ description: 'Nom du patient' })
    @IsOptional()
    @IsString()
    patientName?: string;

    @ApiPropertyOptional({ description: 'ID du médecin' })
    @IsOptional()
    @IsString()
    doctorId?: string;

    @ApiPropertyOptional({ description: 'ID du patient' })
    @IsOptional()
    @IsString()
    patientId?: string;

    @ApiPropertyOptional({ description: 'Statut du rendez-vous (PENDING, ACCEPTED, DECLINED)' })
    @IsOptional()
    @IsString()
    status?: string;
}

export class UpdateAppointmentDto {
    @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() dateTime?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() endTime?: string;
    @ApiPropertyOptional({ enum: EventType }) @IsOptional() @IsEnum(EventType) type?: EventType;
    @ApiPropertyOptional({ enum: AlertOption }) @IsOptional() @IsEnum(AlertOption) alertBefore?: AlertOption;
    @ApiPropertyOptional() @IsOptional() @IsString() patientName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
