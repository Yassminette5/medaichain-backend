import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicManagementController } from './clinic-management.controller';
import { ClinicManagementService } from './clinic-management.service';
import { Clinic, ClinicSchema } from './schemas/clinic.schema';
import { ClinicDoctor, ClinicDoctorSchema } from './schemas/clinic-doctor.schema';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { Admission, AdmissionSchema } from './schemas/admission.schema';
import { MedicalRecord, MedicalRecordSchema } from './schemas/medical-record.schema';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ProfilesModule } from '../profiles/profiles.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Clinic.name, schema: ClinicSchema },
            { name: ClinicDoctor.name, schema: ClinicDoctorSchema },
            { name: Appointment.name, schema: AppointmentSchema },
            { name: Admission.name, schema: AdmissionSchema },
            { name: MedicalRecord.name, schema: MedicalRecordSchema },
            { name: Invoice.name, schema: InvoiceSchema },
            { name: User.name, schema: UserSchema },
        ]),
        ProfilesModule,
        forwardRef(() => AuthModule),
        NotificationModule,
    ],
    controllers: [ClinicManagementController],
    providers: [ClinicManagementService],
    exports: [ClinicManagementService],
})
export class ClinicManagementModule { }
