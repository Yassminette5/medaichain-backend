import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class MedicationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  dosage: string;

  @IsString()
  @IsNotEmpty()
  frequency: string;

  @IsString()
  @IsNotEmpty()
  duration: string;
}

export class CreateAiPrescriptionDto {
  @ApiProperty({ description: 'ID of the patient' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'List of medications', type: [MedicationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  medications: MedicationDto[];

  @ApiProperty({ description: 'Diagnosis from AI', required: false })
  @IsString()
  diagnosis?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsString()
  notes?: string;
}
