import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FormPatientLocationDto {
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  address?: string;
}

export class FormPatientDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ValidateNested()
  @Type(() => FormPatientLocationDto)
  @IsOptional()
  location?: FormPatientLocationDto;
}

export class FormMedicationDto {
  // Preferred client keys
  @ValidateIf((o: FormMedicationDto) => !o.medicationName)
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsString()
  @IsOptional()
  dosage?: string;

  // Alternative keys used by some clients
  @ValidateIf((o: FormMedicationDto) => !o.name)
  @IsString()
  @IsNotEmpty()
  medicationName?: string;

  @IsString()
  @IsOptional()
  medicationDosage?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  // Some clients reuse prescription medication shapes; keep these whitelisted.
  @IsString()
  @IsOptional()
  frequency?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CreateMedicationRequestFormDto {
  @IsString()
  pharmacyId: string;

  @ValidateNested()
  @Type(() => FormPatientDto)
  patient: FormPatientDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormMedicationDto)
  @IsOptional()
  medications?: FormMedicationDto[];

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;

  @IsBoolean()
  @IsOptional()
  requestsDelivery?: boolean;

  @IsString()
  @IsOptional()
  prescriptionImageUrl?: string;

  // Present in some client payloads; whitelist it even if we don't use it.
  @IsString()
  @IsOptional()
  doctorName?: string;
}
