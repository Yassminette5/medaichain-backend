import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiConversation, AiConversationSchema } from './schemas/ai-conversation.schema';
import { AiMessage, AiMessageSchema } from './schemas/ai-message.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AiConversation.name, schema: AiConversationSchema },
            { name: AiMessage.name, schema: AiMessageSchema },
        ]),
        AuthModule,
    ],
    controllers: [AiController],
    providers: [AiService],
    exports: [AiService],
})
export class AiModule { }
