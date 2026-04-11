import { Controller, Post, Get, Body, Headers, Logger, UseGuards, Req } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir le statut de mon abonnement IA' })
  async getMySubscription(@Req() req: any) {
    return this.subscriptionService.getSubscriptionStatus(req.user.id);
  }

  @Post('add-ad-credit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter un crédit après avoir visionné une publicité' })
  async addAdCredit(@Req() req: any) {
    const credits = await this.subscriptionService.addAiCredits(req.user.id, 1);
    return { success: true, aiCredits: credits };
  }

  @Post('webhooks/revenuecat')
  @ApiOperation({ summary: 'Webhook RevenueCat pour synchroniser les achats' })
  async handleRevenueCatWebhook(
    @Headers('x-revenuecat-signature') signature: string,
    @Body() body: any,
  ) {
    this.logger.log('Webhook RevenueCat reçu');

    try {
      const event = body.event;
      if (!event) {
        return { status: 'ignored', reason: 'No event in payload' };
      }

      const eventType = event.type;
      const appUserId = event.app_user_id;
      const transaction = event.transaction;

      if (!appUserId) {
        return { status: 'ignored', reason: 'No app_user_id' };
      }

      switch (eventType) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'NON_RENEWING_PURCHASE': {
          const entitlement = event.entitlement_id;
          let plan = 'starter';
          if (entitlement === 'medaichain Pro') {
            plan = 'professional';
          } else if (entitlement === 'Pack Plus') {
            plan = 'starter'; // Ou un autre plan correspondant si vous avez ajouté un nouveau plan, pour le moment "starter" vu qu'il donne un "accès limité".
          }

          await this.subscriptionService.syncRevenueCat(appUserId, {
            customerId: appUserId,
            transactionId: transaction?.revenue_cat_id || '',
            plan,
            subscriptionEnd: transaction?.expires_at ? new Date(transaction.expires_at) : undefined,
            isActive: true,
          });

          this.logger.log(`Achat RevenueCat: ${appUserId} -> ${plan}`);
          break;
        }

        case 'CANCELLATION': {
          await this.subscriptionService.syncRevenueCat(appUserId, {
            isActive: false,
          });
          this.logger.log(`Annulation RevenueCat: ${appUserId}`);
          break;
        }

        case 'EXPIRATION': {
          await this.subscriptionService.syncRevenueCat(appUserId, {
            isActive: false,
            plan: 'free',
          });
          this.logger.log(`Expiration RevenueCat: ${appUserId}`);
          break;
        }

        default:
          this.logger.log(`Event RevenueCat non géré: ${eventType}`);
      }

      return { status: 'ok', event: eventType };
    } catch (error) {
      this.logger.error(`Erreur webhook RevenueCat: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }
}
