import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionsRepository } from '../../shared/database/repositories/subscriptions.repository';
import { UsersRepository } from '../../shared/database/repositories/users.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

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
    private readonly notificationsService: NotificationsService,
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
}
