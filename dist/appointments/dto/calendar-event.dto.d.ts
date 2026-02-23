import { EventType, AlertOption } from '../schemas/calendar-event.schema';
export declare class CreateCalendarEventDto {
    title: string;
    description?: string;
    dateTime: string;
    endTime?: string;
    type: EventType;
    alertBefore?: AlertOption;
    patientName?: string;
}
export declare class UpdateCalendarEventDto {
    title?: string;
    description?: string;
    dateTime?: string;
    endTime?: string;
    type?: EventType;
    alertBefore?: AlertOption;
    patientName?: string;
}
