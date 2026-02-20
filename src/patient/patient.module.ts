import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OcrService } from './services/ocr.service';
import { OcrController } from './controllers/ocr.controller';
import { OCRDataSchema } from './entities/ocr.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'OCRData', schema: OCRDataSchema }]),
        AuthModule,
    ],
    controllers: [OcrController],
    providers: [OcrService],
    exports: [OcrService],
})
export class PatientModule { }
