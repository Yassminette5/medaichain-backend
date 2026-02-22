import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum, IsDateString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RecordType } from '../schemas/medical-record.schema';

export class VitalSignsDto {
    @ApiPropertyOptional({ example: 120, description: 'Pression systolique (mmHg)' })
    @IsOptional() @IsNumber()
    bloodPressureSystolic?: number;

    @ApiPropertyOptional({ example: 80, description: 'Pression diastolique (mmHg)' })
    @IsOptional() @IsNumber()
    bloodPressureDiastolic?: number;

    @ApiPropertyOptional({ example: 72, description: 'Fréquence cardiaque (bpm)' })
    @IsOptional() @IsNumber()
    heartRate?: number;

    @ApiPropertyOptional({ example: 37.2, description: 'Température (°C)' })
    @IsOptional() @IsNumber()
    temperature?: number;

    @ApiPropertyOptional({ example: 75, description: 'Poids (kg)' })
    @IsOptional() @IsNumber()
    weight?: number;

    @ApiPropertyOptional({ example: 175, description: 'Taille (cm)' })
    @IsOptional() @IsNumber()
    height?: number;

    @ApiPropertyOptional({ example: 98, description: 'Saturation O2 (%)' })
    @IsOptional() @IsNumber()
    oxygenSaturation?: number;

    @ApiPropertyOptional({ example: 0.95, description: 'Glycémie (g/L)' })
    @IsOptional() @IsNumber()
    bloodSugar?: number;
}

export class MedicationDto {
    @ApiProperty({ example: 'Amoxicilline', description: 'Nom du médicament' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: '500mg', description: 'Dosage' })
    @IsOptional() @IsString()
    dosage?: string;

    @ApiPropertyOptional({ example: '3 fois par jour', description: 'Fréquence' })
    @IsOptional() @IsString()
    frequency?: string;

    @ApiPropertyOptional({ example: '7 jours', description: 'Durée' })
    @IsOptional() @IsString()
    duration?: string;

    @ApiPropertyOptional({ example: 'Après les repas', description: 'Instructions' })
    @IsOptional() @IsString()
    instructions?: string;
}

export class CreateMedicalRecordDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'ID du patient' })
    @IsString()
    patientId: string;

    @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'ID du médecin' })
    @IsString()
    doctorId: string;

    @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013', description: 'ID du rendez-vous' })
    @IsOptional() @IsString()
    appointmentId?: string;

    @ApiPropertyOptional({ enum: RecordType, default: RecordType.CONSULTATION })
    @IsOptional() @IsEnum(RecordType)
    type?: RecordType;

    @ApiPropertyOptional({ example: 'Douleurs abdominales persistantes', description: 'Motif principal' })
    @IsOptional() @IsString()
    chiefComplaint?: string;

    @ApiPropertyOptional({ example: ['Douleur', 'Fièvre', 'Nausées'], description: 'Symptômes' })
    @IsOptional() @IsArray()
    symptoms?: string[];

    @ApiPropertyOptional({ description: 'Examen physique' })
    @IsOptional() @IsString()
    physicalExamination?: string;

    @ApiPropertyOptional({ example: 'Gastrite aiguë', description: 'Diagnostic' })
    @IsOptional() @IsString()
    diagnosis?: string;

    @ApiPropertyOptional({ example: ['Ulcère gastrique', 'Appendicite'], description: 'Diagnostics différentiels' })
    @IsOptional() @IsArray()
    differentialDiagnosis?: string[];

    @ApiPropertyOptional({ type: VitalSignsDto })
    @IsOptional() @ValidateNested()
    @Type(() => VitalSignsDto)
    vitalSigns?: VitalSignsDto;

    @ApiPropertyOptional({ type: [MedicationDto], description: 'Ordonnance' })
    @IsOptional() @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MedicationDto)
    prescription?: MedicationDto[];

    @ApiPropertyOptional({ example: ['NFS', 'CRP', 'Glycémie'], description: 'Analyses demandées' })
    @IsOptional() @IsArray()
    labTestsRequested?: string[];

    @ApiPropertyOptional({ description: 'Résultats analyses' })
    @IsOptional() @IsString()
    labResults?: string;

    @ApiPropertyOptional({ example: ['Radiographie thorax'], description: 'Imagerie demandée' })
    @IsOptional() @IsArray()
    imagingRequested?: string[];

    @ApiPropertyOptional({ description: 'Résultats imagerie' })
    @IsOptional() @IsString()
    imagingResults?: string;

    @ApiPropertyOptional({ description: 'Fichiers joints (URLs)' })
    @IsOptional() @IsArray()
    attachments?: string[];

    @ApiPropertyOptional({ description: 'Date prochain RDV' })
    @IsOptional() @IsDateString()
    followUpDate?: string;

    @ApiPropertyOptional({ description: 'Instructions de suivi' })
    @IsOptional() @IsString()
    followUpNotes?: string;

    @ApiPropertyOptional({ description: 'Notes du médecin' })
    @IsOptional() @IsString()
    doctorNotes?: string;

    @ApiPropertyOptional({ example: 'Ahmed Ben Ali' })
    @IsOptional() @IsString()
    patientName?: string;

    @ApiPropertyOptional({ example: 'Dr. Karim Bouzid' })
    @IsOptional() @IsString()
    doctorName?: string;
}

export class UpdateMedicalRecordDto extends PartialType(CreateMedicalRecordDto) { }
