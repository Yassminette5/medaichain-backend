import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionPlan,
} from './schemas/subscription.schema';

export interface AiUsageLimit {
  monthlyQuota: number;
  dailyQuota: number;
}

const PLAN_LIMITS: Record<string, AiUsageLimit> = {
  free: { monthlyQuota: 3, dailyQuota: 1 },
  starter: { monthlyQuota: 25, dailyQuota: 5 },
  professional: { monthlyQuota: 150, dailyQuota: 20 },
  enterprise: { monthlyQuota: 999999, dailyQuota: 999999 },
};

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async getOrCreateSubscription(userId: string): Promise<SubscriptionDocument> {
    let sub = await this.subscriptionModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!sub) {
      sub = await this.subscriptionModel.create({
        userId: new Types.ObjectId(userId),
        plan: 'free',
        aiCredits: 0,
        monthlyAiUsage: 0,
        isActive: true,
        lastResetDate: new Date(),
      });
    }

    await this.resetMonthlyUsageIfNeeded(sub);
    return sub;
  }

  async checkAiAccess(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    remainingQuota?: number;
    useAdCredit?: boolean;
  }> {
    const sub = await this.getOrCreateSubscription(userId);

    if (!sub.isActive) {
      return {
        allowed: false,
        reason: 'Abonnement désactivé. Contactez le support.',
      };
    }

    const now = new Date();
    const isPremium =
      sub.plan !== SubscriptionPlan.FREE &&
      sub.subscriptionEnd &&
      now <= sub.subscriptionEnd;

    if (isPremium) {
      const limits = PLAN_LIMITS[sub.plan] || PLAN_LIMITS.starter;
      if (sub.monthlyAiUsage >= limits.monthlyQuota) {
        return {
          allowed: false,
          reason: `Quota mensuel atteint (${limits.monthlyQuota} analyses). Passez à un plan supérieur.`,
        };
      }
      return {
        allowed: true,
        useAdCredit: false,
        remainingQuota: limits.monthlyQuota - sub.monthlyAiUsage,
      };
    }

    // Utilisateur gratuit (free) : autoriser le quota mensuel sans crédits pub
    const freeLimits = PLAN_LIMITS['free'];

    // Réinitialiser le compteur mensuel si nécessaire
    await this.resetMonthlyUsageIfNeeded(sub);

    // Vérifier quota mensuel gratuit (3 analyses/mois)
    if (sub.monthlyAiUsage < freeLimits.monthlyQuota) {
      return {
        allowed: true,
        useAdCredit: false,
        remainingQuota: freeLimits.monthlyQuota - sub.monthlyAiUsage,
      };
    }

    // Quota gratuit épuisé → essayer crédits pub
    if (sub.aiCredits > 0) {
      return {
        allowed: true,
        useAdCredit: true,
        remainingQuota: sub.aiCredits,
      };
    }

    return {
      allowed: false,
      reason: `Quota mensuel gratuit atteint (${freeLimits.monthlyQuota} analyses/mois). Regardez une pub ou passez à Premium.`,
    };
  }

  async incrementAiUsage(
    userId: string,
  ): Promise<{ monthlyUsage: number; remainingQuota: number }> {
    const sub = await this.getOrCreateSubscription(userId);
    const limits = PLAN_LIMITS[sub.plan] || PLAN_LIMITS.free;

    const updated = await this.subscriptionModel
      .findByIdAndUpdate(
        sub._id,
        { $inc: { monthlyAiUsage: 1 } },
        { new: true },
      )
      .exec();

    this.logger.log(
      `Usage IA incrémenté pour ${userId}: ${updated.monthlyAiUsage}/${limits.monthlyQuota} ce mois`,
    );

    return {
      monthlyUsage: updated.monthlyAiUsage,
      remainingQuota: limits.monthlyQuota - updated.monthlyAiUsage,
    };
  }

  async addAiCredits(userId: string, amount: number): Promise<number> {
    const sub = await this.getOrCreateSubscription(userId);
    const updated = await this.subscriptionModel
      .findByIdAndUpdate(
        sub._id,
        { $inc: { aiCredits: amount } },
        { new: true },
      )
      .exec();

    this.logger.log(
      `${amount} crédits IA ajoutés pour ${userId}. Total: ${updated.aiCredits}`,
    );
    return updated.aiCredits;
  }

  async consumeAiCredit(userId: string): Promise<boolean> {
    const sub = await this.getOrCreateSubscription(userId);

    if (sub.aiCredits <= 0) {
      return false;
    }

    await this.subscriptionModel
      .findByIdAndUpdate(sub._id, { $inc: { aiCredits: -1 } })
      .exec();

    this.logger.log(
      `1 crédit IA consommé pour ${userId}. Restant: ${sub.aiCredits - 1}`,
    );
    return true;
  }

  async syncRevenueCat(
    userId: string,
    data: {
      customerId?: string;
      transactionId?: string;
      plan?: string;
      subscriptionEnd?: Date;
      isActive?: boolean;
    },
  ): Promise<SubscriptionDocument> {
    const sub = await this.getOrCreateSubscription(userId);

    const update: any = { source: 'revenuecat' };
    if (data.customerId) update.revenueCatCustomerId = data.customerId;
    if (data.transactionId) update.revenueCatTransactionId = data.transactionId;
    if (data.plan) update.plan = data.plan;
    if (data.subscriptionEnd) update.subscriptionEnd = data.subscriptionEnd;
    if (data.isActive !== undefined) update.isActive = data.isActive;
    if (data.plan && !data.subscriptionEnd) {
      update.subscriptionStart = new Date();
      update.subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    const updated = await this.subscriptionModel
      .findByIdAndUpdate(sub._id, update, { new: true })
      .exec();

    this.logger.log(
      `RevenueCat synchronisé pour ${userId}: plan=${data.plan}, actif=${data.isActive}`,
    );
    return updated;
  }

  async getSubscriptionStatus(userId: string): Promise<any> {
    const sub = await this.getOrCreateSubscription(userId);
    const limits = PLAN_LIMITS[sub.plan] || PLAN_LIMITS.free;

    return {
      plan: sub.plan,
      aiCredits: sub.aiCredits,
      monthlyUsage: sub.monthlyAiUsage,
      monthlyQuota: limits.monthlyQuota,
      remainingQuota: limits.monthlyQuota - sub.monthlyAiUsage,
      subscriptionStart: sub.subscriptionStart,
      subscriptionEnd: sub.subscriptionEnd,
      isActive: sub.isActive,
      source: sub.source,
    };
  }

  private async resetMonthlyUsageIfNeeded(
    sub: SubscriptionDocument,
  ): Promise<void> {
    const now = new Date();
    const lastReset = sub.lastResetDate
      ? new Date(sub.lastResetDate)
      : new Date(0);

    if (
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      await this.subscriptionModel
        .findByIdAndUpdate(sub._id, {
          monthlyAiUsage: 0,
          lastResetDate: now,
        })
        .exec();

      this.logger.log(`Usage mensuel réinitialisé pour ${sub.userId}`);
    }
  }

  private async getTodayUsage(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sub = await this.subscriptionModel
      .findOne({
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!sub) return 0;

    const logs = await this.subscriptionModel.collection
      .aggregate([
        { $match: { _id: sub._id } },
        { $project: { monthlyUsage: 1 } },
      ])
      .toArray();

    return logs.length > 0 ? logs[0].monthlyUsage || 0 : 0;
  }
}
