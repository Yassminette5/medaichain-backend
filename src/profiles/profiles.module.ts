import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { DoctorProfile, DoctorProfileSchema } from './schemas/doctor-profile.schema';
import { PatientInformation, PatientInformationSchema } from './schemas/patient_information.schema';
import { PharmacyProfile, PharmacyProfileSchema } from './schemas/pharmacy-profile.schema';
import { LabProfile, LabProfileSchema } from './schemas/lab-profile.schema';
import { ClinicProfile, ClinicProfileSchema } from './schemas/clinic-profile.schema';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: DoctorProfile.name, schema: DoctorProfileSchema },
            { name: PatientInformation.name, schema: PatientInformationSchema },
            { name: PharmacyProfile.name, schema: PharmacyProfileSchema },
            { name: LabProfile.name, schema: LabProfileSchema },
            { name: ClinicProfile.name, schema: ClinicProfileSchema },
        ]),
        UsersModule,
        forwardRef(() => AuthModule),
    ],
    controllers: [ProfilesController],
    providers: [ProfilesService],
    exports: [ProfilesService],
})
export class ProfilesModule { }
