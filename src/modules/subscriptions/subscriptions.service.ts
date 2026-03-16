import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionsRepository } from '../../shared/database/repositories/subscriptions.repository';
import { UsersRepository } from '../../shared/database/repositories/users.repository';
import { PlansRepository } from '../../shared/database/repositories/plans.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { StripeService } from './services/stripe.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ConstantKeys } from '../../shared/config/constant-keys';

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly plansRepository: PlansRepository,
    private readonly notificationsService: NotificationsService,
    private readonly stripeService: StripeService,
    @Inject(ConstantKeys.stripePriceIdBasic)
    private readonly stripePriceIdBasic: string,
    @Inject(ConstantKeys.stripePriceIdPremium)
    private readonly stripePriceIdPremium: string,
  ) {}

  async subscribe(userId: string, dto: CreateSubscriptionDto) {
    const active = await this.subscriptionsRepository.findFirst({
      where: { userId, isActive: true },
    });
    if (active) {
      throw new ConflictException(
        'Já existe uma assinatura ativa. Cancele ou renove a atual.',
      );
    }

    const startDate = new Date(dto.startDate);
    const months = dto.billingIntervalMonths ?? 1;
    const nextRenewalAt = addMonths(startDate, months);

    const subscription = await this.subscriptionsRepository.create({
      data: {
        userId,
        value: dto.value,
        startDate,
        nextRenewalAt,
        isActive: true,
        isTrial: false,
      },
    });

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

    return subscription;
  }

  async cancel(userId: string) {
    const subscription = await this.subscriptionsRepository.findFirst({
      where: { userId, isActive: true },
    });
    if (!subscription) {
      throw new NotFoundException('Nenhuma assinatura ativa encontrada.');
    }

    return this.subscriptionsRepository.update({
      where: { id: subscription.id },
      data: {
        isActive: false,
        cancelRequestedAt: new Date(),
      },
    });
  }

  async renew(userId: string) {
    const subscription = await this.subscriptionsRepository.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    if (!subscription) {
      throw new NotFoundException('Nenhuma assinatura encontrada.');
    }

    const nextRenewalAt = addMonths(
      subscription.nextRenewalAt > new Date()
        ? subscription.nextRenewalAt
        : new Date(),
      1,
    );

    const data: {
      isActive: boolean;
      cancelRequestedAt: null;
      nextRenewalAt: Date;
      reactivatedAt?: Date;
    } = {
      isActive: true,
      cancelRequestedAt: null,
      nextRenewalAt,
    };
    if (!subscription.isActive) {
      data.reactivatedAt = new Date();
    }

    return this.subscriptionsRepository.update({
      where: { id: subscription.id },
      data,
    });
  }

  async getSubscription(userId: string) {
    const active = await this.subscriptionsRepository.findFirst({
      where: { userId, isActive: true },
    });
    if (active) {
      return active;
    }

    const last = await this.subscriptionsRepository.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    if (!last) {
      throw new NotFoundException('Nenhuma assinatura encontrada.');
    }
    return last;
  }

  async createCheckoutSessionUrl(
    userId: string,
    successUrl: string,
    cancelUrl: string,
    planId?: string,
  ): Promise<string> {
    const user = await this.usersRepository.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    const plan = planId
      ? await this.plansRepository.findUnique({
          where: { id: planId },
          select: { name: true, isActive: true },
        })
      : await this.plansRepository.findFirst({
          where: { isActive: true },
          orderBy: { price: 'asc' },
          select: { name: true },
        });
    if (!plan || (planId && !plan.isActive)) {
      throw new NotFoundException('Plano não encontrado.');
    }
    const priceId = this.getStripePriceIdForPlanName(plan.name);
    if (!priceId) {
      throw new BadRequestException(
        'Plano não possui preço configurado no Stripe.',
      );
    }
    return this.stripeService.createCheckoutSession(
      userId,
      successUrl,
      cancelUrl,
      user.email,
      priceId,
    );
  }

  private getStripePriceIdForPlanName(name: string): string | null {
    const normalized = name.toUpperCase();
    if (normalized === 'PREMIUM' && this.stripePriceIdPremium) {
      return this.stripePriceIdPremium;
    }
    if (normalized === 'BASIC' && this.stripePriceIdBasic) {
      return this.stripePriceIdBasic;
    }
    return this.stripePriceIdBasic || null;
  }

  async createPortalSessionUrl(
    userId: string,
    returnUrl: string,
  ): Promise<string> {
    let stripeCustomerId: string | null = null;

    const user = await this.usersRepository.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });
    if (user?.stripeCustomerId) {
      stripeCustomerId = user.stripeCustomerId;
    }

    if (!stripeCustomerId) {
      const subscription = await this.subscriptionsRepository.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
      if (subscription?.stripeSubscriptionId) {
        stripeCustomerId =
          await this.stripeService.getCustomerIdFromSubscription(
            subscription.stripeSubscriptionId,
          );
        if (stripeCustomerId) {
          await this.usersRepository.update({
            where: { id: userId },
            data: { stripeCustomerId },
          });
        }
      }
    }

    if (!stripeCustomerId) {
      throw new NotFoundException(
        'Nenhum cliente Stripe encontrado. Complete o checkout primeiro.',
      );
    }
    return this.stripeService.createPortalSession(stripeCustomerId, returnUrl);
  }
}
