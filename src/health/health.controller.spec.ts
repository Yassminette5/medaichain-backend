import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { NotificationService } from '../notifications/notification.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: NotificationService,
          useValue: {
            getFirebaseStatus: () => ({
              configured: true,
              initialized: false,
              usingServiceAccountPath: true,
              projectId: 'medaichain-19e32',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('should return firebase health status', () => {
    expect(controller.firebase()).toEqual({
      ok: true,
      firebase: {
        configured: true,
        initialized: false,
        usingServiceAccountPath: true,
        projectId: 'medaichain-19e32',
      },
    });
  });
});
