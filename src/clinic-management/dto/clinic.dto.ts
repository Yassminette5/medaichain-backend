import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateClinicDto {
    @ApiProperty({ example: 'Clinique El Afia' })
    @IsString()
    name: string;

    @ApiProperty({ example: '12 Rue Didouche Mourad, Alger' })
    @IsString()
    address: string;

    @ApiPropertyOptional({ example: '0551234567' })
    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @ApiPropertyOptional({ example: 'contact@clinique-elafia.dz' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ example: 'Alger' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ example: 'Alger' })
    @IsOptional()
    @IsString()
    wilaya?: string;

    @ApiPropertyOptional({ example: 'Clinique spécialisée en cardiologie et chirurgie' })
    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateClinicDto {
    @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() phoneNumber?: string;
    @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() wilaya?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
