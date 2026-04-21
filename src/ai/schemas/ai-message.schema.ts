import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiMessageDocument = AiMessage & Document;

@Schema({ timestamps: true })
export class AiMessage {
    @Prop({ type: Types.ObjectId, ref: 'AiConversation', required: true })
    conversationId: Types.ObjectId;

    @Prop({ required: true, enum: ['user', 'assistant'] })
    role: string;

    @Prop({ required: true })
    content: string;

    @Prop({ default: 'paragraph' })
    type: string; // paragraph, warning, steps, medicine, causes

    @Prop({ type: Object })
    data: any; // For structured data returned by AI
}

export const AiMessageSchema = SchemaFactory.createForClass(AiMessage);
