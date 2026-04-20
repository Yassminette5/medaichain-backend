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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let AiController = class AiController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    async getConversations(req) {
        return this.aiService.findAllConversations(req.user.userId);
    }
    async getMessages(req, id) {
        return this.aiService.getConversationMessages(id, req.user.userId);
    }
    async createConversation(req, data) {
        return this.aiService.getOrCreateConversation(req.user.userId, data.id);
    }
    async addMessage(req, id, data) {
        return this.aiService.addMessage(id, req.user.userId, data);
    }
    async deleteConversation(req, id) {
        return this.aiService.deleteConversation(id, req.user.userId);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)('conversations'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtenir toutes les conversations AI' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('conversations/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtenir l\'historique des messages d\'une conversation' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('conversations'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer une nouvelle conversation AI' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "createConversation", null);
__decorate([
    (0, common_1.Post)('conversations/:id/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Enregistrer un nouveau message dans une conversation' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "addMessage", null);
__decorate([
    (0, common_1.Delete)('conversations/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Supprimer une conversation AI' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "deleteConversation", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('AI Conversations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map