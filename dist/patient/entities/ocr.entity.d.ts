import { Document, Types } from 'mongoose';
export type OCRDataDocument = OCRData & Document;
export declare class OCRData {
    userId: Types.ObjectId;
    title: string;
    image_name: string;
    description?: string;
}
export declare const OCRDataSchema: import("mongoose").Schema<OCRData, import("mongoose").Model<OCRData, any, any, any, Document<unknown, any, OCRData, any, {}> & OCRData & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OCRData, Document<unknown, {}, import("mongoose").FlatRecord<OCRData>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<OCRData> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
