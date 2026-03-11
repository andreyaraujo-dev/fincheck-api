import { Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ConstantKeys } from '../../shared/config/constant-keys';
import { SubscriptionsRepository } from '../../shared/database/repositories/subscriptions.repository';
import { UsersRepository } from '../../shared/database/repositories/users.repository';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(
    @Inject(ConstantKeys.stripeSecretKey) stripeSecretKey: string,
    @Inject(ConstantKeys.stripeWebhookSecret) stripeWebhookSecret: string,
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly notificationsService: NotificationsService,
  ) {
    this.stripe = new Stripe(stripeSecretKey);
    this.webhookSecret = stripeWebhookSecret;
  }

  async handleStripeEvent(
    rawBody: Buffer,
    signature: string | undefined,
  ): Promise<void> {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature ?? '',
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.warn(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
      throw err;
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const userId = session.client_reference_id;
    const subscriptionId = session.subscription;

    if (!userId || typeof subscriptionId !== 'string') {
      this.logger.warn('Checkout session missing userId or subscription');
      return;
    }

    const existingByStripeId = await this.subscriptionsRepository.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });
    if (existingByStripeId) {
      this.logger.debug(
        `Subscription ${subscriptionId} already exists, skipping`,
      );
      return;
    }

    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      subscriptionId,
      {
        expand: ['items.data.price'],
      },
    );

    const firstItem = stripeSubscription.items.data[0];
    const price = firstItem?.price;
    const value =
      price && typeof price !== 'string' && price.unit_amount
        ? price.unit_amount / 100
        : 0;
    const startDate = new Date(
      (stripeSubscription.start_date ?? stripeSubscription.created) * 1000,
    );
    const periodEnd =
      firstItem?.current_period_end ?? stripeSubscription.created;
    const nextRenewalAt = new Date(periodEnd * 1000);

    const existingTrialOrActive = await this.subscriptionsRepository.findFirst({
      where: { userId, isActive: true },
    });

    if (existingTrialOrActive) {
      await this.subscriptionsRepository.update({
        where: { id: existingTrialOrActive.id },
        data: {
          stripeSubscriptionId: stripeSubscription.id,
          value,
          startDate,
          nextRenewalAt,
          isActive: true,
          isTrial: false,
          trialEndsAt: null,
          cancelRequestedAt: null,
        },
      });
      this.logger.log(
        `Subscription ${existingTrialOrActive.id} upgraded from trial for user ${userId}`,
      );
    } else {
      await this.subscriptionsRepository.create({
        data: {
          userId,
          stripeSubscriptionId: stripeSubscription.id,
          value,
          startDate,
          nextRenewalAt,
          isActive: true,
          isTrial: false,
        },
      });
    }

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;
    if (customerId) {
      await this.usersRepository.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const user = await this.usersRepository.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (user) {
      this.notificationsService.notify({
        userId,
        type: 'PAYMENT_CONFIRMED',
        channel: 'BOTH',
        title: 'Pagamento confirmado!',
        message: 'Sua assinatura do myCash está ativa.',
        email: {
          to: user.email,
          subject: 'Pagamento confirmado!',
          template: 'payment-confirmed',
          variables: { name: user.name },
        },
      });
    }

    this.logger.log(`Subscription created for user ${userId}`);
  }

  private async handleSubscriptionUpdated(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const existing = await this.subscriptionsRepository.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!existing) {
      this.logger.debug(
        `Subscription ${stripeSubscription.id} not found in DB, skipping`,
      );
      return;
    }

    const firstItem = stripeSubscription.items?.data?.[0];
    const nextRenewalAt = new Date(
      (firstItem?.current_period_end ?? stripeSubscription.created) * 1000,
    );
    const cancelRequestedAt = stripeSubscription.cancel_at_period_end
      ? new Date()
      : null;

    const isActive = ['active', 'trialing'].includes(stripeSubscription.status);

    await this.subscriptionsRepository.update({
      where: { id: existing.id },
      data: {
        nextRenewalAt,
        cancelRequestedAt,
        isActive,
      },
    });

    this.logger.log(`Subscription ${stripeSubscription.id} updated`);
  }

  private async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const existing = await this.subscriptionsRepository.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!existing) {
      this.logger.debug(
        `Subscription ${stripeSubscription.id} not found in DB, skipping`,
      );
      return;
    }

    await this.subscriptionsRepository.update({
      where: { id: existing.id },
      data: {
        isActive: false,
        cancelRequestedAt: new Date(),
      },
    });

    this.logger.log(
      `Subscription ${stripeSubscription.id} marked as cancelled`,
    );
  }
}
