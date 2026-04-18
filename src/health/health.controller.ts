import { Controller, Get } from '@nestjs/common';
import { NotificationService } from '../notifications/notification.service';

@Controller('health')
export class HealthController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('firebase')
  firebase() {
    return {
      ok: true,
      firebase: this.notificationService.getFirebaseStatus(),
    };
  }
}
