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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiMessageSchema = exports.AiMessage = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let AiMessage = class AiMessage {
};
exports.AiMessage = AiMessage;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'AiConversation', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AiMessage.prototype, "conversationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['user', 'assistant'] }),
    __metadata("design:type", String)
], AiMessage.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AiMessage.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'paragraph' }),
    __metadata("design:type", String)
], AiMessage.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], AiMessage.prototype, "data", void 0);
exports.AiMessage = AiMessage = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], AiMessage);
exports.AiMessageSchema = mongoose_1.SchemaFactory.createForClass(AiMessage);
//# sourceMappingURL=ai-message.schema.js.map