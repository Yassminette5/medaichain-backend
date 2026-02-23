import { Model } from 'mongoose';
import { CalendarEventDocument } from './schemas/calendar-event.schema';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto/calendar-event.dto';
import { Notification } from '../notifications/schemas/notification.schema';
export declare class AppointmentsService {
    private eventModel;
    private notificationModel;
    constructor(eventModel: Model<CalendarEventDocument>, notificationModel: Model<Notification>);
    create(doctorId: string, dto: CreateCalendarEventDto): Promise<CalendarEventDocument>;
    private createNotificationForEvent;
    findAllByDoctor(doctorId: string): Promise<CalendarEventDocument[]>;
    findByMonth(doctorId: string, year: number, month: number): Promise<CalendarEventDocument[]>;
    findById(doctorId: string, eventId: string): Promise<CalendarEventDocument>;
    update(doctorId: string, eventId: string, dto: UpdateCalendarEventDto): Promise<CalendarEventDocument>;
    delete(doctorId: string, eventId: string): Promise<void>;
}
