import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';
import { DoctorStatus } from '../schemas/clinic-doctor.schema';

export class AddDoctorToClinicDto {
    @ApiProperty({ description: 'ID du user médecin', example: '60d5ec49f1b2c72b7c8e4a3d' })
    @IsString()
    doctorId: string;

    @ApiProperty({ example: 'Dr. Ahmed Benali' })
    @IsString()
    fullName: string;

    @ApiPropertyOptional({ example: 'Cardiologie' })
    @IsOptional()
    @IsString()
    speciality?: string;

    @ApiPropertyOptional({ example: '0551234567' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: 'dr.ahmed@email.com' })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({ example: ['Lundi', 'Mardi', 'Mercredi'] })
    @IsOptional()
    @IsArray()
    workingDays?: string[];

    @ApiPropertyOptional({ example: '08:00' })
    @IsOptional()
    @IsString()
    workingHoursStart?: string;

    @ApiPropertyOptional({ example: '17:00' })
    @IsOptional()
    @IsString()
    workingHoursEnd?: string;

    @ApiPropertyOptional({ example: 2000 })
    @IsOptional()
    @IsNumber()
    consultationFee?: number;
}

export class UpdateClinicDoctorDto {
    @ApiPropertyOptional() @IsOptional() @IsString() speciality?: string;
    @ApiPropertyOptional() @IsOptional() @IsArray() workingDays?: string[];
    @ApiPropertyOptional() @IsOptional() @IsString() workingHoursStart?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() workingHoursEnd?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() consultationFee?: number;
    @ApiPropertyOptional() @IsOptional() @IsEnum(DoctorStatus) status?: DoctorStatus;
}
