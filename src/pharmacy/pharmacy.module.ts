import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PharmacyController } from './pharmacy.controller';
import { PharmacyStockService } from './pharmacy-stock.service';
import { PharmacyStatisticsService } from './pharmacy-statistics.service';
import { MedicationRequestService } from './medication-request.service';
import {
  MedicationStock,
  MedicationStockSchema,
  StockSettings,
  StockSettingsSchema,
} from './schemas/medication-stock.schema';
import {
  MedicationRequest,
  MedicationRequestSchema,
} from './schemas/medication-request.schema';
import { ProfilesModule } from '../profiles/profiles.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notifications/notification.module';
import { PrescriptionAnalysisService } from './prescription-analysis.service';
import { NftModule } from '../nft/nft.module';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MedicationStock.name, schema: MedicationStockSchema },
      { name: StockSettings.name, schema: StockSettingsSchema },
      { name: MedicationRequest.name, schema: MedicationRequestSchema },
    ]),
    ProfilesModule,
    forwardRef(() => AuthModule),
    NotificationModule,
    NftModule,
    UsersModule,
    WalletModule,
  ],
  controllers: [PharmacyController],
  providers: [
    PharmacyStockService,
    PharmacyStatisticsService,
    MedicationRequestService,
    PrescriptionAnalysisService,
  ],
  exports: [
    PharmacyStockService,
    PharmacyStatisticsService,
    MedicationRequestService,
    PrescriptionAnalysisService,
  ],
})
export class PharmacyModule {}
