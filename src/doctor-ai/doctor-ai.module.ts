import { Module, forwardRef } from '@nestjs/common';
import { DoctorAiService } from './doctor-ai.service';
import { DoctorAiController } from './doctor-ai.controller';
import { ConfigModule } from '@nestjs/config';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { PatientModule } from '../patient/patient.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [ConfigModule, forwardRef(() => PrescriptionsModule), PatientModule, SubscriptionModule],
  controllers: [DoctorAiController],
  providers: [DoctorAiService],
  exports: [DoctorAiService],
})
export class DoctorAiModule {}
