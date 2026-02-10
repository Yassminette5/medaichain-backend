import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { DoctorProfile, DoctorProfileSchema } from './schemas/doctor-profile.schema';
import { PatientProfile, PatientProfileSchema } from './schemas/patient-profile.schema';
import { PharmacyProfile, PharmacyProfileSchema } from './schemas/pharmacy-profile.schema';
import { LabProfile, LabProfileSchema } from './schemas/lab-profile.schema';
import { ClinicProfile, ClinicProfileSchema } from './schemas/clinic-profile.schema';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: DoctorProfile.name, schema: DoctorProfileSchema },
            { name: PatientProfile.name, schema: PatientProfileSchema },
            { name: PharmacyProfile.name, schema: PharmacyProfileSchema },
            { name: LabProfile.name, schema: LabProfileSchema },
            { name: ClinicProfile.name, schema: ClinicProfileSchema },
        ]),
        UsersModule,
    ],
    controllers: [ProfilesController],
    providers: [ProfilesService],
    exports: [ProfilesService],
})
export class ProfilesModule { }
