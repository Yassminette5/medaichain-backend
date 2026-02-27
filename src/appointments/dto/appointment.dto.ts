import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
    @ApiProperty()
    @IsString()
    title: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsDateString()
    dateTime: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    endTime?: string;

    @ApiProperty()
    @IsString()
    type: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    alertBefore?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    patientName?: string;
}

export class UpdateAppointmentDto {
    @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() dateTime?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() endTime?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() alertBefore?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() patientName?: string;
}
