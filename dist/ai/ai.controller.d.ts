import { AiService } from './ai.service';
import { Response } from 'express';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    chat(data: {
        question: string;
    }): Promise<any>;
    searchMedicine(data: {
        name: string;
    }): Promise<any>;
    generateQrCode(data: {
        data: string;
    }, res: Response): Promise<void>;
    analyze(file: Express.Multer.File): Promise<any>;
    getConversations(req: any): Promise<import("./schemas/ai-conversation.schema").AiConversationDocument[]>;
    getMessages(req: any, id: string): Promise<import("./schemas/ai-message.schema").AiMessageDocument[]>;
    createConversation(req: any, data: {
        id?: string;
    }): Promise<import("./schemas/ai-conversation.schema").AiConversationDocument>;
    addMessage(req: any, id: string, data: any): Promise<import("./schemas/ai-message.schema").AiMessageDocument>;
    deleteConversation(req: any, id: string): Promise<void>;
}
