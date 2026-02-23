import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, Min, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { RequestStatus } from '../schemas/medication-request.schema';

export class MedicationItemDto {
  @IsString()
  medicationName: string;

  @IsString()
  medicationDosage: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string = 'unités';
}

export class PatientLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateMedicationRequestDto {
  @IsString()
  patientId: string;

  @IsString()
  patientName: string;

  @IsString()
  @IsOptional()
  patientPhone?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PatientLocationDto)
  @IsOptional()
  patientLocation?: PatientLocationDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationItemDto)
  medications: MedicationItemDto[];

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean = false;

  @IsBoolean()
  @IsOptional()
  requestsDelivery?: boolean = false;

  @IsString()
  @IsOptional()
  prescriptionImageUrl?: string;
}

export class UpdateMedicationRequestDto {
  @IsEnum(RequestStatus)
  @IsOptional()
  status?: RequestStatus;

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;
}
