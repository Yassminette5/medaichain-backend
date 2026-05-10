import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CalendarEventDocument = CalendarEvent & Document;

@Schema({ timestamps: true, collection: 'calendar_events' })
export class CalendarEvent {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId; // FK → User (Le propriétaire de cet événement, ex: le médecin)

    @Prop({ required: true })
    title: string;

    @Prop()
    description: string;

    @Prop({ required: true })
    dateTime: Date;

    @Prop()
    endTime: Date;

    @Prop({ required: true })
    type: string; // 'consultation', 'operation', 'note'

    @Prop()
    alertBefore: string; // 'none', 'min5', 'min15', 'min30', 'hour1', 'day1'

    @Prop({ type: Types.ObjectId, ref: 'User' })
    patientId: Types.ObjectId;

    @Prop()
    patientName: string;

    @Prop({ default: 'PENDING' })
    status: string; // 'PENDING', 'ACCEPTED', 'DECLINED'
}

export const CalendarEventSchema = SchemaFactory.createForClass(CalendarEvent);
