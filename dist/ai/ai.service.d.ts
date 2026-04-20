import { Model } from 'mongoose';
import { AiConversationDocument } from './schemas/ai-conversation.schema';
import { AiMessage, AiMessageDocument } from './schemas/ai-message.schema';
export declare class AiService {
    private conversationModel;
    private messageModel;
    constructor(conversationModel: Model<AiConversationDocument>, messageModel: Model<AiMessageDocument>);
    getOrCreateConversation(userId: string, conversationId?: string): Promise<AiConversationDocument>;
    findAllConversations(userId: string): Promise<AiConversationDocument[]>;
    getConversationMessages(conversationId: string, userId: string): Promise<AiMessageDocument[]>;
    addMessage(conversationId: string, userId: string, data: Partial<AiMessage>): Promise<AiMessageDocument>;
    deleteConversation(conversationId: string, userId: string): Promise<void>;
}
