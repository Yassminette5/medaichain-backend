import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from '../subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private subscriptionService: SubscriptionService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new HttpException(
        'Non authentifié.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const access = await this.subscriptionService.checkAiAccess(user.id);

    if (!access.allowed) {
      throw new HttpException(
        {
          message: access.reason || 'Accès IA refusé. Abonnement Premium ou crédit publicitaire requis.',
          code: 'AI_ACCESS_DENIED',
          remainingQuota: access.remainingQuota,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Si un crédit ad a été autorisé, on le consomme, sinon on incrémente l'usage premium
    if (access.useAdCredit) {
      await this.subscriptionService.consumeAiCredit(user.id);
    } else {
      await this.subscriptionService.incrementAiUsage(user.id);
    }

    request.aiRemainingQuota = access.remainingQuota;
    return true;
  }
}
