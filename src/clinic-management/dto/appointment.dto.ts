import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { AppointmentStatus } from '../schemas/appointment.schema';

export class CreateAppointmentDto {
    @ApiProperty({ description: 'ID du médecin', example: '60d5ec49f1b2c72b7c8e4a3d' })
    @IsString()
    doctorId: string;

    @ApiProperty({ description: 'ID du patient', example: '60d5ec49f1b2c72b7c8e4a3e' })
    @IsString()
    patientId: string;

    @ApiProperty({ example: '2026-03-01' })
    @IsDateString()
    date: string;

    @ApiProperty({ example: '09:00 - 09:30' })
    @IsString()
    timeSlot: string;

    @ApiPropertyOptional({ example: 'Consultation cardiologique' })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional({ example: 'Ahmed Benali' })
    @IsOptional()
    @IsString()
    patientName?: string;

    @ApiPropertyOptional({ example: 'Dr. Karim' })
    @IsOptional()
    @IsString()
    doctorName?: string;
}

export class UpdateAppointmentDto {
    @ApiPropertyOptional() @IsOptional() @IsEnum(AppointmentStatus) status?: AppointmentStatus;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() diagnosis?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() prescription?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() date?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() timeSlot?: string;
}
