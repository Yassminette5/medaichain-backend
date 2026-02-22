import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    Request,
} from '@nestjs/common';
import { MedicinesService } from './medicines.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Medicines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('medicines')
export class MedicinesController {
    constructor(private readonly medicinesService: MedicinesService) { }

    @Post()
    @ApiOperation({ summary: 'Ajouter un nouveau rappel de médicament' })
    async create(@Request() req, @Body() data: any) {
        return this.medicinesService.create(req.user.userId, data);
    }

    @Get()
    @ApiOperation({ summary: 'Obtenir tous mes rappels de médicaments' })
    async findAll(@Request() req) {
        return this.medicinesService.findAll(req.user.userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtenir les détails d\'un médicament' })
    async findOne(@Param('id') id: string) {
        return this.medicinesService.findOne(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un rappel de médicament' })
    async remove(@Request() req, @Param('id') id: string) {
        return this.medicinesService.remove(id, req.user.userId);
    }
}
