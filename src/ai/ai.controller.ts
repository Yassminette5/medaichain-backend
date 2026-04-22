import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@ApiTags('AI Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    // ========== PROXY ENDPOINTS ==========

    @Post('chat')
    @ApiOperation({ summary: 'Proxy pour le chat AI' })
    async chat(@Body() data: { question: string }) {
        return this.aiService.proxyToAi('/chat', data);
    }

    @Post('medicine')
    @ApiOperation({ summary: 'Proxy pour la recherche de médicaments' })
    async searchMedicine(@Body() data: { name: string }) {
        return this.aiService.proxyToAi('/medicine', data);
    }

    @Post('qrcode')
    @ApiOperation({ summary: 'Proxy pour la génération de QR Code' })
    async generateQrCode(@Body() data: { data: string }, @Res() res: Response) {
        const buffer = await this.aiService.proxyToAi('/qrcode', data);
        res.set('Content-Type', 'image/png');
        res.send(buffer);
    }

    @Post('analyze')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Proxy pour l\'analyse d\'image' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    async analyze(@UploadedFile() file: Express.Multer.File) {
        const url = `${this.aiService['aiMicroserviceUrl']}/analyze`;
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
        formData.append('file', blob, file.originalname);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`AI Microservice error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`[AiController] Analyze proxy failed: ${error.message}`);
            throw error;
        }
    }

    // ========== CONVERSATION MANAGEMENT ==========

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
