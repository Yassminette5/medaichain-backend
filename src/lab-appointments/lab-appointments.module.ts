import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LabAppointmentsService } from './lab-appointments.service';
import { LabAppointmentsController } from './lab-appointments.controller';
import { LabAppointment, LabAppointmentSchema } from './schemas/lab-appointment.schema';
import { LabModule } from '../lab/lab.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: LabAppointment.name, schema: LabAppointmentSchema },
        ]),
        LabModule,
        ProfilesModule,
        NotificationModule,
    ],
    controllers: [LabAppointmentsController],
    providers: [LabAppointmentsService],
    exports: [LabAppointmentsService],
})
export class LabAppointmentsModule {}
