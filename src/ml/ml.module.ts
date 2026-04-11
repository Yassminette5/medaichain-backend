import { Module } from '@nestjs/common';
import { MlService } from './ml.service';
import { MlApiService } from './ml-api.service';
import { MlController } from './ml.controller';
import { OcrMlService } from './ocr-ml.service';
import { OcrMlController } from './ocr-ml.controller';

@Module({
  controllers: [MlController, OcrMlController],
  providers: [MlService, MlApiService, OcrMlService],
  exports: [MlService, MlApiService, OcrMlService],
})
export class MlModule {}