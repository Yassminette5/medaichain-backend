"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const ai_conversation_schema_1 = require("./schemas/ai-conversation.schema");
const ai_message_schema_1 = require("./schemas/ai-message.schema");
let AiService = class AiService {
    constructor(conversationModel, messageModel) {
        this.conversationModel = conversationModel;
        this.messageModel = messageModel;
    }
    async getOrCreateConversation(userId, conversationId) {
        if (conversationId) {
            const conv = await this.conversationModel.findOne({ _id: new mongoose_2.Types.ObjectId(conversationId), userId: new mongoose_2.Types.ObjectId(userId) }).exec();
            if (conv)
                return conv;
        }
        const newConv = new this.conversationModel({
            userId: new mongoose_2.Types.ObjectId(userId),
        });
        return newConv.save();
    }
    async findAllConversations(userId) {
        return this.conversationModel.find({ userId: new mongoose_2.Types.ObjectId(userId), isActive: true }).sort({ updatedAt: -1 }).exec();
    }
    async getConversationMessages(conversationId, userId) {
        const conv = await this.conversationModel.findOne({ _id: new mongoose_2.Types.ObjectId(conversationId), userId: new mongoose_2.Types.ObjectId(userId) }).exec();
        if (!conv) {
            throw new common_1.NotFoundException('Conversation non trouvée');
        }
        return this.messageModel.find({ conversationId: new mongoose_2.Types.ObjectId(conversationId) }).sort({ createdAt: 1 }).exec();
    }
    async addMessage(conversationId, userId, data) {
        const conv = await this.conversationModel.findOne({ _id: new mongoose_2.Types.ObjectId(conversationId), userId: new mongoose_2.Types.ObjectId(userId) }).exec();
        if (!conv) {
            throw new common_1.NotFoundException('Conversation non trouvée');
        }
        const newMessage = new this.messageModel({
            ...data,
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
        });
        if (data.role === 'user' && conv.title === 'Nouvelle conversation') {
            conv.title = data.content.substring(0, 30) + (data.content.length > 30 ? '...' : '');
        }
        await conv.save();
        return newMessage.save();
    }
    async deleteConversation(conversationId, userId) {
        await this.conversationModel.findOneAndUpdate({ _id: new mongoose_2.Types.ObjectId(conversationId), userId: new mongoose_2.Types.ObjectId(userId) }, { isActive: false }).exec();
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(ai_conversation_schema_1.AiConversation.name)),
    __param(1, (0, mongoose_1.InjectModel)(ai_message_schema_1.AiMessage.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], AiService);
//# sourceMappingURL=ai.service.js.map