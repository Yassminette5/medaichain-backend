import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString, IsOptional, IsArray, IsBoolean,
    IsNumber, IsEmail,
} from 'class-validator';

export class UpdateClinicProfileDto {
    @ApiPropertyOptional({ example: 'Clinique El Afia', description: 'Nom de la clinique' })
    @IsOptional() @IsString()
    clinicName?: string;

    @ApiPropertyOptional({ example: 'Dr. Ahmed Benali', description: 'Nom du directeur médical' })
    @IsOptional() @IsString()
    directorName?: string;

    @ApiPropertyOptional({ example: 'AGR-2025-001', description: 'Numéro d\'agrément' })
    @IsOptional() @IsString()
    licenseNumber?: string;

    @ApiPropertyOptional({ example: 'RC-2025-12345', description: 'Numéro d\'enregistrement commercial' })
    @IsOptional() @IsString()
    registrationNumber?: string;

    @ApiPropertyOptional({ example: '12 Rue Didouche Mourad', description: 'Adresse complète' })
    @IsOptional() @IsString()
    address?: string;

    @ApiPropertyOptional({ example: 'Alger' })
    @IsOptional() @IsString()
    city?: string;

    @ApiPropertyOptional({ example: 'Alger' })
    @IsOptional() @IsString()
    wilaya?: string;

    @ApiPropertyOptional({ example: '16000' })
    @IsOptional() @IsString()
    postalCode?: string;

    @ApiPropertyOptional({ example: 36.737232 })
    @IsOptional() @IsNumber()
    gpsLatitude?: number;

    @ApiPropertyOptional({ example: 3.086472 })
    @IsOptional() @IsNumber()
    gpsLongitude?: number;

    @ApiPropertyOptional({ example: ['Cardiologie', 'Chirurgie', 'Pédiatrie'], description: 'Spécialités offertes' })
    @IsOptional() @IsArray() @IsString({ each: true })
    specialities?: string[];

    @ApiPropertyOptional({ example: ['Urgences', 'Radiologie', 'Bloc opératoire'], description: 'Services disponibles' })
    @IsOptional() @IsArray() @IsString({ each: true })
    services?: string[];

    @ApiPropertyOptional({ example: 80, description: 'Nombre de lits' })
    @IsOptional() @IsNumber()
    bedCount?: number;

    @ApiPropertyOptional({ example: true, description: 'Dispose d\'un service d\'urgence 24/7' })
    @IsOptional() @IsBoolean()
    hasEmergency?: boolean;

    @ApiPropertyOptional({ example: true, description: 'Dispose d\'une ambulance' })
    @IsOptional() @IsBoolean()
    hasAmbulance?: boolean;

    @ApiPropertyOptional({ example: ['CNAS', 'CASNOS'], description: 'Assurances acceptées' })
    @IsOptional() @IsArray() @IsString({ each: true })
    insuranceAccepted?: string[];

    @ApiPropertyOptional({ example: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'] })
    @IsOptional() @IsArray() @IsString({ each: true })
    workingDays?: string[];

    @ApiPropertyOptional({ example: '08:00', description: 'Heure d\'ouverture' })
    @IsOptional() @IsString()
    openingTime?: string;

    @ApiPropertyOptional({ example: '17:00', description: 'Heure de fermeture' })
    @IsOptional() @IsString()
    closingTime?: string;

    @ApiPropertyOptional({ example: 'https://clinique-elafia.dz', description: 'Site web' })
    @IsOptional() @IsString()
    website?: string;

    @ApiPropertyOptional({ example: '/uploads/clinic-profiles/logo.png', description: 'Photo de profil / logo' })
    @IsOptional() @IsString()
    profilePhoto?: string;
}
