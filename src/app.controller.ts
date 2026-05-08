import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('signup.html')
  getSignupPage(@Res() res: Response) {
    const filePath = join(process.cwd(), 'public', 'signup.html');
    return res.sendFile(filePath);
  }

  @Get('signup.js')
  getSignupJs(@Res() res: Response) {
    const filePath = join(process.cwd(), 'public', 'signup.js');
    return res.sendFile(filePath);
  }

  @Get('style.css')
  getStyleCss(@Res() res: Response) {
    const filePath = join(process.cwd(), 'public', 'style.css');
    return res.sendFile(filePath);
  }
}
