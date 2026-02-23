
import {
    IsEmail,
    IsString,
    MinLength,
    IsEnum,
    IsPhoneNumber,
    IsNotEmpty,
    IsOptional,
    IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/schemas/user.schema';

export class AuthCredentialsDto {
    @ApiProperty({ example: 'user@example.com', description: 'Adresse email de l\'utilisateur' })
    @IsEmail({}, { message: 'Email invalide' })
    email: string;

    @ApiProperty({ example: 'password123', description: 'Mot de passe (min 6 caractères)' })
    @IsString()
    @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
    password: string;
}

export class RegisterDto {
    @ApiProperty({ example: 'medecin@example.com' })
    @IsEmail({}, { message: 'Email invalide' })
    email: string;

    @ApiProperty({ example: 'Password123!' })
    @IsString()
    @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    password: string;

    @ApiProperty({ example: '+213555123456' })
    @IsString()
    @IsNotEmpty({ message: 'Le numéro de téléphone est requis' })
    phone: string;

    @ApiProperty({ enum: UserRole, example: UserRole.MEDECIN })
    @IsEnum(UserRole, { message: 'Rôle invalide' })
    role: UserRole;

    // Champs optionnels pour Médecin / Patient
    @ApiProperty({ example: 'Jean Dupont', required: false, description: 'Nom complet (pour patients)' })
    @IsString()
    @IsOptional()
    fullName?: string;

    @ApiProperty({ example: 'Jean', required: false })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiProperty({ example: 'Dupont', required: false })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiProperty({ example: 'Cardiologie', required: false })
    @IsString()
    @IsOptional()
    speciality?: string;

    @ApiProperty({ example: 'CHU Tlemcen', required: false })
    @IsString()
    @IsOptional()
    hospital?: string;

    @ApiProperty({ example: '12345/DZ', required: false })
    @IsString()
    @IsOptional()
    licenseNumber?: string;

    @ApiProperty({ example: 'Tlemcen', required: false })
    @IsString()
    @IsOptional()
    wilaya?: string;

    @ApiProperty({ example: 5, required: false })
    @IsOptional()
    yearsOfExperience?: number;

    // Champs pour Centre d'Analyse
    @ApiProperty({ example: 'Laboratoire Alpha', required: false })
    @IsString()
    @IsOptional()
    centreName?: string;

    @ApiProperty({ example: 'Biologie', required: false })
    @IsString()
    @IsOptional()
    categorie?: string;

    @ApiProperty({ example: 'Alger', required: false })
    @IsString()
    @IsOptional()
    localisation?: string;

    // Champs pour Pharmacie
    @ApiProperty({ example: 'Pharmacie El Amel', required: false })
    @IsString()
    @IsOptional()
    pharmacyName?: string;

    @ApiProperty({ example: 'Dr. Pharmacien', required: false })
    @IsString()
    @IsOptional()
    ownerName?: string;

    @ApiProperty({ example: 'Alger', required: false })
    @IsString()
    @IsOptional()
    gouvernorat?: string;

    @ApiProperty({ example: 'Bab El Oued', required: false })
    @IsString()
    @IsOptional()
    delegation?: string;

    @ApiProperty({ example: '12 Rue de la Liberté', required: false })
    @IsString()
    @IsOptional()
    address?: string;

    // Champs pour Clinique
    @ApiProperty({ example: 'Clinique Espoir', required: false })
    @IsString()
    @IsOptional()
    clinicName?: string;

    @ApiProperty({ example: '2023-01-01', required: false })
    @IsOptional()
    creationDate?: Date;

    @ApiProperty({ example: 'contact@clinique.com', required: false })
    @IsString()
    @IsOptional()
    officialEmail?: string;
}

export class LoginDto {
    @ApiProperty({ example: 'medecin@example.com' })
    @IsEmail({}, { message: 'Email invalide' })
    email: string;

    @ApiProperty({ example: 'Password123!' })
    @IsString()
    @IsNotEmpty({ message: 'Le mot de passe est requis' })
    password: string;
}

export class ForgotPasswordDto {
    @ApiProperty({ example: 'medecin@example.com' })
    @IsEmail({}, { message: 'Email invalide' })
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({ example: 'abc123token' })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ example: 'NewPassword123!' })
    @IsString()
    @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    newPassword: string;
}

export class RefreshTokenDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

export class InviteDto {
    @ApiProperty({ example: 'medecin@example.com' })
    @IsEmail({}, { message: 'Email invalide' })
    email: string;

    @ApiProperty({ enum: UserRole, example: UserRole.MEDECIN })
    @IsEnum(UserRole, { message: 'Rôle invalide' })
    role: UserRole;
}

export class CompleteInviteDto {
    @ApiProperty({ example: 'uuid-token', description: 'Token d\'invitation reçu par email' })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ example: 'password123', description: 'Mot de passe choisi par l\'utilisateur' })
    @IsString()
    @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
    password: string;

    @ApiProperty({ example: 'Jean', description: 'Prénom (Médecin/Clinique)' })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty({ example: 'Dupont', description: 'Nom (Médecin)' })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiProperty({ example: '0555123456', description: 'Numéro de téléphone' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    // Champs spécifiques...
    @IsOptional() @IsString() speciality?: string;
    @IsOptional() @IsString() wilaya?: string;
    @IsOptional() @IsNumber() yearsOfExperience?: number;
    @IsOptional() @IsString() centreName?: string;
    @IsOptional() @IsString() categorie?: string;
    @IsOptional() @IsString() localisation?: string;
    @IsOptional() @IsString() pharmacyName?: string;
    @IsOptional() @IsString() ownerName?: string;
    @IsOptional() @IsString() licenseNumber?: string;
    @IsOptional() @IsString() address?: string;
    @IsOptional() @IsString() gouvernorat?: string;
    @IsOptional() @IsString() delegation?: string;
    @IsOptional() @IsString() clinicName?: string;
    @IsOptional() creationDate?: Date;
    @IsOptional() @IsString() officialEmail?: string;
}

export class AdminCreateUserDto {
    @ApiProperty({ example: 'medecin@example.com' })
    @IsEmail({}, { message: 'Email invalide' })
    email: string;

    @ApiProperty({ example: '+213555123456' })
    @IsString()
    @IsNotEmpty({ message: 'Le numéro de téléphone est requis' })
    phone: string;

    @ApiProperty({ enum: UserRole, example: UserRole.MEDECIN })
    @IsEnum(UserRole, { message: 'Rôle invalide' })
    role: UserRole;
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiProperty({ example: 'Dupont', required: false })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiProperty({ example: 'Cardiologie', required: false })
    @IsString()
    @IsOptional()
    speciality?: string;

    @ApiProperty({ example: '12345/DZ', required: false })
    @IsString()
    @IsOptional()
    licenseNumber?: string;

    @ApiProperty({ example: 'Tlemcen', required: false })
    @IsString()
    @IsOptional()
    wilaya?: string;

    @ApiProperty({ example: 5, required: false })
    @IsOptional()
    yearsOfExperience?: number;

    @ApiProperty({ example: 'Laboratoire Alpha', required: false })
    @IsString()
    @IsOptional()
    centreName?: string;

    @ApiProperty({ example: 'Biologie', required: false })
    @IsString()
    @IsOptional()
    categorie?: string;

    @ApiProperty({ example: 'Alger', required: false })
    @IsString()
    @IsOptional()
    localisation?: string;

    @ApiProperty({ example: 'Pharmacie El Amel', required: false })
    @IsString()
    @IsOptional()
    pharmacyName?: string;

    @ApiProperty({ example: 'Dr. Pharmacien', required: false })
    @IsString()
    @IsOptional()
    ownerName?: string;

    @ApiProperty({ example: 'Alger', required: false })
    @IsString()
    @IsOptional()
    gouvernorat?: string;

    @ApiProperty({ example: 'Bab El Oued', required: false })
    @IsString()
    @IsOptional()
    delegation?: string;

    @ApiProperty({ example: '12 Rue de la Liberté', required: false })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({ example: 'Clinique Espoir', required: false })
    @IsString()
    @IsOptional()
    clinicName?: string;

    @ApiProperty({ example: '2023-01-01', required: false })
    @IsOptional()
    creationDate?: Date;

    @ApiProperty({ example: 'contact@clinique.com', required: false })
    @IsString()
    @IsOptional()
    officialEmail?: string;
}

