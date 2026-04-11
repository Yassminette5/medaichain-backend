import { Controller, Post, Body } from '@nestjs/common';
import { MlService } from './ml.service';
import { MlApiService } from './ml-api.service';

@Controller('ml')
export class MlController {

  constructor(
    private readonly mlService: MlService,
    private readonly mlApiService: MlApiService,
  ) {}

  @Post('predict')
  async predict(@Body() body: any) {
    return this.mlService.predict(body);
  }

  /** 2ᵉ modèle (dossier ml-api) — même entrée JSON que /predict (sans obligation tier côté Python). */
  @Post('predict-ml-api')
  async predictMlApi(@Body() body: any) {
    return this.mlApiService.predictLab(body);
  }
}