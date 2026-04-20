import { Document, Types } from 'mongoose';
export type AiMessageDocument = AiMessage & Document;
export declare class AiMessage {
    conversationId: Types.ObjectId;
    role: string;
    content: string;
    type: string;
    data: any;
}
export declare const AiMessageSchema: import("mongoose").Schema<AiMessage, import("mongoose").Model<AiMessage, any, any, any, Document<unknown, any, AiMessage, any, {}> & AiMessage & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AiMessage, Document<unknown, {}, import("mongoose").FlatRecord<AiMessage>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<AiMessage> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
