import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('AI Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Get('conversations')
    @ApiOperation({ summary: 'Obtenir toutes les conversations AI' })
    async getConversations(@Request() req) {
        return this.aiService.findAllConversations(req.user.userId);
    }

    @Get('conversations/:id')
    @ApiOperation({ summary: 'Obtenir l\'historique des messages d\'une conversation' })
    async getMessages(@Request() req, @Param('id') id: string) {
        return this.aiService.getConversationMessages(id, req.user.userId);
    }

    @Post('conversations')
    @ApiOperation({ summary: 'Créer une nouvelle conversation AI' })
    async createConversation(@Request() req, @Body() data: { id?: string }) {
        return this.aiService.getOrCreateConversation(req.user.userId, data.id);
    }

    @Post('conversations/:id/messages')
    @ApiOperation({ summary: 'Enregistrer un nouveau message dans une conversation' })
    async addMessage(@Request() req, @Param('id') id: string, @Body() data: any) {
        return this.aiService.addMessage(id, req.user.userId, data);
    }

    @Delete('conversations/:id')
    @ApiOperation({ summary: 'Supprimer une conversation AI' })
    async deleteConversation(@Request() req, @Param('id') id: string) {
        return this.aiService.deleteConversation(id, req.user.userId);
    }
}
