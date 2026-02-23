import { Document, Types } from 'mongoose';
export type MedicineDocument = Medicine & Document;
export declare class Medicine {
    userId: Types.ObjectId;
    name: string;
    type: string;
    dosage: string;
    schedule: string[];
    duration: string;
    frequency: string;
    cause: string;
    capSize: string;
    instructions: string;
    startDate: Date;
    isActive: boolean;
}
export declare const MedicineSchema: import("mongoose").Schema<Medicine, import("mongoose").Model<Medicine, any, any, any, Document<unknown, any, Medicine, any, {}> & Medicine & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Medicine, Document<unknown, {}, import("mongoose").FlatRecord<Medicine>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Medicine> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
