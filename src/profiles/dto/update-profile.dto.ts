import {
    IsString,
    IsOptional,
    IsNumber,
    IsBoolean,
    IsArray,
    IsEnum,
    IsEmail,
    Min,
    Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Gender } from '../schemas/patient_information.schema';

// ==============================
// DTO – Médecin
// ==============================
export class UpdateDoctorProfileDto {
    @ApiProperty({ example: 'Dr. Ahmed Benali', required: false })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiProperty({ example: 'Cardiologie', required: false })
    @IsOptional()
    @IsString()
    speciality?: string;

    @ApiProperty({ example: 'Chirurgie cardiaque', required: false })
    @IsOptional()
    @IsString()
    subSpeciality?: string;

    @ApiProperty({ example: '12345/DZ', required: false })
    @IsOptional()
    @IsString()
    licenseNumber?: string;

    @ApiProperty({ example: 'CHU Tlemcen', required: false })
    @IsOptional()
    @IsString()
    hospital?: string;

    @ApiProperty({ example: '12 Rue Ibn Khaldoun', required: false })
    @IsOptional()
    @IsString()
    clinicAddress?: string;

    @ApiProperty({ example: 'Tlemcen', required: false })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({ example: 'Tlemcen', required: false })
    @IsOptional()
    @IsString()
    wilaya?: string;

    @ApiProperty({ example: 10, required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    yearsOfExperience?: number;

    @ApiProperty({ example: 2000, required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    consultationFee?: number;

    @ApiProperty({ example: ['Arabe', 'Français'], required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    languages?: string[];

    @ApiProperty({ example: ['Lundi', 'Mardi', 'Mercredi'], required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    workingDays?: string[];

    @ApiProperty({ example: '08:00', required: false })
    @IsOptional()
    @IsString()
    workingHoursStart?: string;

    @ApiProperty({ example: '17:00', required: false })
    @IsOptional()
    @IsString()
    workingHoursEnd?: string;

    @ApiProperty({ example: 'Spécialiste en maladies cardiovasculaires...', required: false })
    @IsOptional()
    @IsString()
    bio?: string;
}

// ==============================
// DTO – Centre d'Analyse (Lab)
// ==============================
export class UpdateLabProfileDto {
    // ── Champs officiels ──
    @ApiProperty({ example: 'Laboratoire Alpha', required: false })
    @IsOptional()
    @IsString()
    centreName?: string;

    @ApiProperty({ example: ['Biologie', 'Radiologie'], required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    categorie?: string[];

    @ApiProperty({ example: '0555123456', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ example: 'labo@example.com', required: false })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiProperty({ example: 'Alger, Bab El Oued', required: false })
    @IsOptional()
    @IsString()
    localisation?: string;

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ required: false, description: 'Horaires par jour de la semaine' })
    @IsOptional()
    openingHours?: {
        lundi?: { open: string; close: string; isOpen: boolean };
        mardi?: { open: string; close: string; isOpen: boolean };
        mercredi?: { open: string; close: string; isOpen: boolean };
        jeudi?: { open: string; close: string; isOpen: boolean };
        vendredi?: { open: string; close: string; isOpen: boolean };
        samedi?: { open: string; close: string; isOpen: boolean };
        dimanche?: { open: string; close: string; isOpen: boolean };
    };

    // ── Alias acceptés (envoyés par le frontend) ──
    @ApiProperty({ example: 'Laboratoire Alpha', required: false, description: 'Alias de centreName' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ example: 'Laboratoire Alpha', required: false, description: 'Alias de centreName' })
    @IsOptional()
    @IsString()
    centre_name?: string;

    @ApiProperty({ example: 'Alger', required: false, description: 'Alias de localisation' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({ example: ['Biologie'], required: false, description: 'Alias de categorie', type: [String] })
    @IsOptional()
    categories?: string[] | string;

    @ApiProperty({ example: '0555123456', required: false, description: 'Alias de phone' })
    @IsOptional()
    @IsString()
    telephone?: string;

    @ApiProperty({ example: '0555123456', required: false, description: 'Alias de phone' })
    @IsOptional()
    @IsString()
    tel?: string;

    @ApiProperty({ example: 'labo@example.com', required: false, description: 'Alias de email' })
    @IsOptional()
    @IsString()
    mail?: string;

    @ApiProperty({ example: false, required: false, description: 'Alias de isActive' })
    @IsOptional()
    is_active?: boolean;
}

// ==============================
// DTO – Pharmacie
// ==============================
export class UpdatePharmacyProfileDto {
    @ApiProperty({ example: 'Pharmacie El Amel', required: false })
    @IsOptional()
    @IsString()
    pharmacyName?: string;

    @ApiProperty({ example: 'Dr. Benali Karim', required: false })
    @IsOptional()
    @IsString()
    ownerName?: string;

    @ApiProperty({ example: '12345/DZ', required: false })
    @IsOptional()
    @IsString()
    licenseNumber?: string;

    @ApiProperty({ example: '12 Rue de la Liberté', required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ example: 'Oran', required: false })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({ example: 'Oran', required: false })
    @IsOptional()
    @IsString()
    wilaya?: string;

    @ApiProperty({ example: '31000', required: false })
    @IsOptional()
    @IsString()
    postalCode?: string;

    @ApiProperty({ example: 35.6969, required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    gpsLatitude?: number;

    @ApiProperty({ example: -0.6331, required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    gpsLongitude?: number;

    @ApiProperty({ example: ['Lundi', 'Mardi'], required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    workingDays?: string[];

    @ApiProperty({ example: '08:00', required: false })
    @IsOptional()
    @IsString()
    openingTime?: string;

    @ApiProperty({ example: '21:00', required: false })
    @IsOptional()
    @IsString()
    closingTime?: string;

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    @IsBoolean()
    is24Hours?: boolean;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    hasDelivery?: boolean;

    @ApiProperty({ example: 10, required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    deliveryRadius?: number;

    @ApiProperty({ example: 200, required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    deliveryFee?: number;

    @ApiProperty({ example: ['Médicaments génériques', 'Parapharmacie'], required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    services?: string[];
}

// ==============================
// DTO – Clinique
// ==============================
export class UpdateClinicProfileDto {
    @ApiProperty({ example: 'Clinique Espoir', required: false })
    @IsOptional()
    @IsString()
    clinicName?: string;

    @ApiProperty({ example: 'Dr. Directeur Nom', required: false })
    @IsOptional()
    @IsString()
    directorName?: string;

    @ApiProperty({ example: '12345/DZ', required: false })
    @IsOptional()
    @IsString()
    licenseNumber?: string;

    @ApiProperty({ example: '12 Rue Principale', required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ example: 'Alger', required: false })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({ example: 'Alger', required: false })
    @IsOptional()
    @IsString()
    wilaya?: string;

    @ApiProperty({ example: '16000', required: false })
    @IsOptional()
    @IsString()
    postalCode?: string;

    @ApiProperty({ example: 36.7372, required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    gpsLatitude?: number;

    @ApiProperty({ example: 3.0865, required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    gpsLongitude?: number;

    @ApiProperty({ example: ['Cardiologie', 'Chirurgie'], required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    specialities?: string[];

    @ApiProperty({ example: ['Urgences', 'Radiologie'], required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    services?: string[];

    @ApiProperty({ example: 50, required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    bedCount?: number;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    hasEmergency?: boolean;

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    @IsBoolean()
    hasAmbulance?: boolean;

    @ApiProperty({ example: ['CNAS', 'CASNOS'], required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    insuranceAccepted?: string[];

    @ApiProperty({ example: ['Lundi', 'Dimanche'], required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    workingDays?: string[];

    @ApiProperty({ example: '07:00', required: false })
    @IsOptional()
    @IsString()
    openingTime?: string;

    @ApiProperty({ example: '22:00', required: false })
    @IsOptional()
    @IsString()
    closingTime?: string;

    @ApiProperty({ example: 'https://clinique-espoir.dz', required: false })
    @IsOptional()
    @IsString()
    website?: string;

    @ApiProperty({ example: '2010-05-01', required: false })
    @IsOptional()
    creationDate?: Date;

    @ApiProperty({ example: 'contact@clinique.com', required: false })
    @IsOptional()
    @IsEmail()
    officialEmail?: string;
}

// ==============================
// DTO – Patient
// ==============================
export class UpdatePatientProfileDto {
    @ApiProperty({ example: 'Yassmine Hnainia', required: false })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiProperty({ example: 25, required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(130)
    @Type(() => Number)
    age?: number;

    @ApiProperty({ enum: Gender, example: Gender.FEMALE, required: false })
    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @ApiProperty({ example: ['Pénicilline', 'Aspirine'], required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    allergies?: string[];

    @ApiProperty({ example: 165, required: false, description: 'Taille en cm' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    height?: number;

    @ApiProperty({ example: 60, required: false, description: 'Poids en kg' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    weight?: number;
}
