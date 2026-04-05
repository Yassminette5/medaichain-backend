import { Controller, Post, Body } from '@nestjs/common';
import { MlService } from './ml.service';

@Controller('ml')
export class MlController {

  constructor(private readonly mlService: MlService) {}

  @Post('predict')
  async predict(@Body() body: any) {
    return this.mlService.predict(body);
  }
}