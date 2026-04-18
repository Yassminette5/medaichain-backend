import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeTextDto {
  @ApiProperty({ description: 'The medical text or lab results to analyze' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ description: 'Additional context or patient history', required: false })
  @IsString()
  @IsOptional()
  context?: string;
}
