import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PharmacyController } from './pharmacy.controller';
import { PharmacyStockService } from './pharmacy-stock.service';
import { PharmacyStatisticsService } from './pharmacy-statistics.service';
import { MedicationRequestService } from './medication-request.service';
import { MedicationStock, MedicationStockSchema, StockSettings, StockSettingsSchema } from './schemas/medication-stock.schema';
import { MedicationRequest, MedicationRequestSchema } from './schemas/medication-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MedicationStock.name, schema: MedicationStockSchema },
      { name: StockSettings.name, schema: StockSettingsSchema },
      { name: MedicationRequest.name, schema: MedicationRequestSchema },
    ]),
  ],
  controllers: [PharmacyController],
  providers: [
    PharmacyStockService,
    PharmacyStatisticsService,
    MedicationRequestService,
  ],
  exports: [
    PharmacyStockService,
    PharmacyStatisticsService,
    MedicationRequestService,
  ],
})
export class PharmacyModule {}
