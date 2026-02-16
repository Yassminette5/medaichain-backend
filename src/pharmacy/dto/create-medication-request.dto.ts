import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, Min } from 'class-validator';
import { RequestStatus } from '../schemas/medication-request.schema';

export class CreateMedicationRequestDto {
  @IsString()
  patientId: string;

  @IsString()
  patientName: string;

  @IsString()
  @IsOptional()
  patientPhone?: string;

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

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean = false;
}

export class UpdateMedicationRequestDto {
  @IsEnum(RequestStatus)
  @IsOptional()
  status?: RequestStatus;

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;
}
