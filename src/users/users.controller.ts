import { Controller, Get, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Récupérer les statistiques des utilisateurs' })
    @ApiResponse({ status: 200, description: 'Statistiques récupérées' })
    async getStats() {
        return this.usersService.getStats();
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Récupérer la liste de tous les utilisateurs' })
    @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée avec succès' })
    async findAll() {
        return this.usersService.findAll();
    }

    // ========== ACTIVER/DÉSACTIVER UN UTILISATEUR (ADMIN) ==========
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Put(':id/toggle-active')
    @ApiOperation({ summary: 'Activer ou désactiver un utilisateur' })
    async toggleUserActive(@Param('id') id: string) {
        return this.usersService.toggleActive(id);
    }

    // ========== SUPPRIMER UN UTILISATEUR (ADMIN) ==========
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un utilisateur' })
    async deleteUser(@Param('id') id: string) {
        return this.usersService.deleteUser(id);
    }
}
