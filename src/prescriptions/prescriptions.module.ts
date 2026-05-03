import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { Prescription, PrescriptionSchema } from './schemas/prescription.schema';
import { SharedPrescription, SharedPrescriptionSchema } from './schemas/shared-prescription.schema';
import { NotificationModule } from '../notifications/notification.module';
import { NftModule } from '../nft/nft.module';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { DoctorAiModule } from '../doctor-ai/doctor-ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Prescription.name, schema: PrescriptionSchema },
      { name: SharedPrescription.name, schema: SharedPrescriptionSchema },
    ]),
    NotificationModule,
    NftModule,
    UsersModule,
    WalletModule,
    ProfilesModule,
    forwardRef(() => DoctorAiModule),
  ],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule { }
