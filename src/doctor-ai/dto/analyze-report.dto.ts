import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeReportDto {
  @ApiProperty({ description: 'Base64 image or path to the medical report image' })
  @IsString()
  @IsNotEmpty()
  reportImage: string;

  @ApiProperty({ description: 'Additional context or patient history', required: false })
  @IsString()
  @IsOptional()
  context?: string;
}
