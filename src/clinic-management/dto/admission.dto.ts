import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { AdmissionStatus } from '../schemas/admission.schema';

export class CreateAdmissionDto {
    @ApiProperty({ description: 'ID du patient', example: '60d5ec49f1b2c72b7c8e4a3e' })
    @IsString()
    patientId: string;

    @ApiProperty({ example: 'Ahmed Benali' })
    @IsString()
    patientName: string;

    @ApiPropertyOptional({ example: '0551234567' })
    @IsOptional()
    @IsString()
    patientPhone?: string;

    @ApiProperty({ example: 'Consultation générale' })
    @IsString()
    reason: string;

    @ApiPropertyOptional({ description: 'ID du médecin assigné' })
    @IsOptional()
    @IsString()
    doctorId?: string;

    @ApiPropertyOptional({ example: 'Patient recommandé par Dr. X' })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateAdmissionDto {
    @ApiPropertyOptional() @IsOptional() @IsEnum(AdmissionStatus) status?: AdmissionStatus;
    @ApiPropertyOptional() @IsOptional() @IsString() doctorId?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() patientName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() patientPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
