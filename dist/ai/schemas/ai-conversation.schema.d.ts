import { Document, Types } from 'mongoose';
export type AiConversationDocument = AiConversation & Document;
export declare class AiConversation {
    userId: Types.ObjectId;
    title: string;
    isActive: boolean;
}
export declare const AiConversationSchema: import("mongoose").Schema<AiConversation, import("mongoose").Model<AiConversation, any, any, any, Document<unknown, any, AiConversation, any, {}> & AiConversation & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AiConversation, Document<unknown, {}, import("mongoose").FlatRecord<AiConversation>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<AiConversation> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
