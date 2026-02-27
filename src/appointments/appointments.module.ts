import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { CalendarEvent, CalendarEventSchema } from './schemas/appointment.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: CalendarEvent.name, schema: CalendarEventSchema }]),
    ],
    controllers: [AppointmentsController],
    providers: [AppointmentsService],
    exports: [AppointmentsService],
})
export class AppointmentsModule { }
