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
    ) { }

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
}
