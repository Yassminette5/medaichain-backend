import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NotificationService } from './notifications/notification.service';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly notificationService: NotificationService) {}

  onModuleInit() {
    const firebase = this.notificationService.getFirebaseStatus();
    this.logger.log(
      `Firebase status: configured=${firebase.configured} initialized=${firebase.initialized} usingServiceAccountPath=${firebase.usingServiceAccountPath} projectId=${firebase.projectId || 'n/a'}`,
    );
  }

  getHello(): string {
    return 'Hello World!';
  }
}
