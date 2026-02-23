import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CalendarEventDocument = CalendarEvent & Document;

export enum EventType {
    CONSULTATION = 'consultation',
    OPERATION = 'operation',
    NOTE = 'note',
}

export enum AlertOption {
    NONE = 'none',
    MIN_5 = 'min5',
    MIN_15 = 'min15',
    MIN_30 = 'min30',
    HOUR_1 = 'hour1',
    DAY_1 = 'day1',
}

@Schema({ timestamps: true })
export class CalendarEvent {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    doctorId: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop()
    description: string;

    @Prop({ required: true })
    dateTime: Date;

    @Prop()
    endTime: Date;

    @Prop({ enum: EventType, default: EventType.CONSULTATION })
    type: EventType;

    @Prop({ enum: AlertOption, default: AlertOption.NONE })
    alertBefore: AlertOption;

    @Prop()
    patientName: string;
}

export const CalendarEventSchema = SchemaFactory.createForClass(CalendarEvent);
