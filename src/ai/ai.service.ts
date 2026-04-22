import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiConversation, AiConversationDocument } from './schemas/ai-conversation.schema';
import { AiMessage, AiMessageDocument } from './schemas/ai-message.schema';

@Injectable()
export class AiService {
    constructor(
        @InjectModel(AiConversation.name) private conversationModel: Model<AiConversationDocument>,
        @InjectModel(AiMessage.name) private messageModel: Model<AiMessageDocument>,
    ) {
        // Allow self-signed certificates for Ngrok/Kaggle proxying
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    async getOrCreateConversation(userId: string, conversationId?: string): Promise<AiConversationDocument> {
        if (conversationId) {
            const conv = await this.conversationModel.findOne({ _id: new Types.ObjectId(conversationId), userId: new Types.ObjectId(userId) }).exec();
            if (conv) return conv;
        }

        const newConv = new this.conversationModel({
            userId: new Types.ObjectId(userId),
        });
        return newConv.save();
    }

    async findAllConversations(userId: string): Promise<AiConversationDocument[]> {
        return this.conversationModel.find({ userId: new Types.ObjectId(userId), isActive: true }).sort({ updatedAt: -1 }).exec();
    }

    async getConversationMessages(conversationId: string, userId: string): Promise<AiMessageDocument[]> {
        const conv = await this.conversationModel.findOne({ _id: new Types.ObjectId(conversationId), userId: new Types.ObjectId(userId) }).exec();
        if (!conv) {
            throw new NotFoundException('Conversation non trouvée');
        }
        return this.messageModel.find({ conversationId: new Types.ObjectId(conversationId) }).sort({ createdAt: 1 }).exec();
    }

    private readonly aiMicroserviceUrl = 'https://2cc1-34-169-50-143.ngrok-free.app';

    async addMessage(conversationId: string, userId: string, data: Partial<AiMessage>): Promise<AiMessageDocument> {
        const conv = await this.conversationModel.findOne({ _id: new Types.ObjectId(conversationId), userId: new Types.ObjectId(userId) }).exec();
        if (!conv) {
            throw new NotFoundException('Conversation non trouvée');
        }

        const newMessage = new this.messageModel({
            ...data,
            conversationId: new Types.ObjectId(conversationId),
        });

        // Update conversation title if it's the first message
        if (data.role === 'user' && conv.title === 'Nouvelle conversation') {
            conv.title = data.content.substring(0, 30) + (data.content.length > 30 ? '...' : '');
        }

        await conv.save();
        return newMessage.save();
    }

    async deleteConversation(conversationId: string, userId: string): Promise<void> {
        await this.conversationModel.findOneAndUpdate(
            { _id: new Types.ObjectId(conversationId), userId: new Types.ObjectId(userId) },
            { isActive: false }
        ).exec();
    }

    // ========== PROXY TO KAGGLE MICROSERVICE ==========
    async proxyToAi(endpoint: string, body: any, isStream = false) {
        const url = `${this.aiMicroserviceUrl}${endpoint}`;
        console.log(`[AiService] Proxying to AI: ${url}`);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[AiService] Error from AI Microservice (Status ${response.status}): ${errText}`);
                throw new Error(`AI Microservice error: ${response.status} ${response.statusText}`);
            }

            if (isStream) {
                return response.body;
            }

            const contentType = response.headers.get('content-type');
            if (contentType && (contentType.includes('image') || contentType.includes('application/octet-stream'))) {
                const buffer = await response.arrayBuffer();
                return Buffer.from(buffer);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error(`[AiService] CRITICAL: Failed to connect to AI Microservice at ${url}`);
            console.error(`[AiService] Reason: ${error.message}`);
            if (error.cause) {
                console.error(`[AiService] Underlying Cause:`, error.cause);
            }
            throw new Error(`Connectivity Error: Could not reach the AI microservice. Ensure Kaggle is running and the URL in NestJS is correct.`);
        }
    }
}
