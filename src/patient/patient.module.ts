import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OcrService } from './services/ocr.service';
import { OcrController } from './controllers/ocr.controller';
import { OCRDataSchema } from './entities/ocr.entity';
import { PatientAnalysis, PatientAnalysisSchema } from './entities/patient-analysis.entity';
import { PatientAnalysisService } from './services/patient-analysis.service';
import { PatientAnalysisController } from './controllers/patient-analysis.controller';
import { AuthModule } from '../auth/auth.module';
import { NftModule } from '../nft/nft.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'OCRData', schema: OCRDataSchema },
            { name: PatientAnalysis.name, schema: PatientAnalysisSchema },
        ]),
        AuthModule,
        NftModule,
    ],
    controllers: [OcrController, PatientAnalysisController],
    providers: [OcrService, PatientAnalysisService],
    exports: [OcrService, PatientAnalysisService],
})
export class PatientModule { }
