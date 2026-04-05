import { Module } from '@nestjs/common';
import { MlService } from './ml.service';
import { MlController } from './ml.controller';
import { OcrMlService } from './ocr-ml.service';
import { OcrMlController } from './ocr-ml.controller';

@Module({
  controllers: [MlController, OcrMlController],
  providers: [MlService, OcrMlService],
  exports: [MlService, OcrMlService],
})
export class MlModule {}