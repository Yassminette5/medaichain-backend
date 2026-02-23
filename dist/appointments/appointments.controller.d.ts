import { AppointmentsService } from './appointments.service';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto/calendar-event.dto';
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    create(req: any, dto: CreateCalendarEventDto): Promise<import("./schemas/calendar-event.schema").CalendarEventDocument>;
    findAll(req: any): Promise<import("./schemas/calendar-event.schema").CalendarEventDocument[]>;
    findByMonth(req: any, year: number, month: number): Promise<import("./schemas/calendar-event.schema").CalendarEventDocument[]>;
    findById(req: any, id: string): Promise<import("./schemas/calendar-event.schema").CalendarEventDocument>;
    update(req: any, id: string, dto: UpdateCalendarEventDto): Promise<import("./schemas/calendar-event.schema").CalendarEventDocument>;
    delete(req: any, id: string): Promise<{
        message: string;
    }>;
}
