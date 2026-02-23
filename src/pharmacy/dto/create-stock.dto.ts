import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateStockDto {
  @IsString()
  name: string;

  @IsString()
  dosage: string;

  @IsNumber()
  @Min(0)
  currentStock: number;

  @IsNumber()
  @Min(1)
  maxStock: number;

  @IsString()
  @IsOptional()
  unit?: string = 'unités';
}

export class UpdateStockDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  dosage?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentStock?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxStock?: number;
}

export class UpdateStockSettingsDto {
  @IsOptional()
  pushNotificationsEnabled?: boolean;

  @IsOptional()
  weeklyReportsEnabled?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  criticalStockThreshold?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  alertStockThreshold?: number;
}
