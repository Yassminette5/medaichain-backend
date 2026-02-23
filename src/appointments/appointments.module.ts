import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { CalendarEvent, CalendarEventSchema } from './schemas/calendar-event.schema';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: CalendarEvent.name, schema: CalendarEventSchema },
            { name: Notification.name, schema: NotificationSchema },
        ]),
    ],
    controllers: [AppointmentsController],
    providers: [AppointmentsService],
    exports: [AppointmentsService],
})
export class AppointmentsModule { }
