import { Document, Types } from 'mongoose';
export type CalendarEventDocument = CalendarEvent & Document;
export declare enum EventType {
    CONSULTATION = "consultation",
    OPERATION = "operation",
    NOTE = "note"
}
export declare enum AlertOption {
    NONE = "none",
    MIN_5 = "min5",
    MIN_15 = "min15",
    MIN_30 = "min30",
    HOUR_1 = "hour1",
    DAY_1 = "day1"
}
export declare class CalendarEvent {
    doctorId: Types.ObjectId;
    title: string;
    description: string;
    dateTime: Date;
    endTime: Date;
    type: EventType;
    alertBefore: AlertOption;
    patientName: string;
}
export declare const CalendarEventSchema: import("mongoose").Schema<CalendarEvent, import("mongoose").Model<CalendarEvent, any, any, any, Document<unknown, any, CalendarEvent, any, {}> & CalendarEvent & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CalendarEvent, Document<unknown, {}, import("mongoose").FlatRecord<CalendarEvent>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<CalendarEvent> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
