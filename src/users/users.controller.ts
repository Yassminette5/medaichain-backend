import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Récupérer les statistiques des utilisateurs' })
    @ApiResponse({ status: 200, description: 'Statistiques récupérées' })
    async getStats() {
        return this.usersService.getStats();
    }

    @Get()
    @ApiOperation({ summary: 'Récupérer la liste de tous les utilisateurs' })
    @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée avec succès' })
    async findAll() {
        return this.usersService.findAll();
    }
}
