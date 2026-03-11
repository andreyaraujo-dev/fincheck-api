import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConstantKeys } from '../../../shared/config/constant-keys';
import { UsersRepository } from '../../../shared/database/repositories/users.repository';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly priceId: string;

  constructor(
    @Inject(ConstantKeys.stripeSecretKey) stripeSecretKey: string,
    @Inject(ConstantKeys.stripePriceId) stripePriceId: string,
    private readonly usersRepository: UsersRepository,
  ) {
    this.stripe = new Stripe(stripeSecretKey);
    this.priceId = stripePriceId;
  }

  async getOrCreateStripeCustomerId(
    userId: string,
    email: string,
  ): Promise<string> {
    const user = await this.usersRepository.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (user?.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await this.stripe.customers.create({
      email,
      metadata: { userId },
    });

    await this.usersRepository.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  async createCheckoutSession(
    userId: string,
    successUrl: string,
    cancelUrl: string,
    email: string,
  ): Promise<string> {
    const stripeCustomerId = await this.getOrCreateStripeCustomerId(
      userId,
      email,
    );

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      client_reference_id: userId,
      line_items: [
        {
          price: this.priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      throw new Error('Stripe Checkout Session URL not available');
    }

    return session.url;
  }

  async getCustomerIdFromSubscription(
    stripeSubscriptionId: string,
  ): Promise<string | null> {
    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
      const customerId = subscription.customer;
      return typeof customerId === 'string'
        ? customerId
        : (customerId?.id ?? null);
    } catch {
      return null;
    }
  }

  async createPortalSession(
    stripeCustomerId: string,
    returnUrl: string,
  ): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  }
}
