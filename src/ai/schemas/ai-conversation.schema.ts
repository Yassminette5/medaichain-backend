import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiConversationDocument = AiConversation & Document;

@Schema({ timestamps: true })
export class AiConversation {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ default: 'Nouvelle conversation' })
    title: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const AiConversationSchema = SchemaFactory.createForClass(AiConversation);
