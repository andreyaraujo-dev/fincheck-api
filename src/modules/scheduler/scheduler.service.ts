import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsRepository } from '../../shared/database/repositories/subscriptions.repository';
import { UsersRepository } from '../../shared/database/repositories/users.repository';
import { NotificationsRepository } from '../../shared/database/repositories/notifications.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { LoggerService } from '../../shared/services/logger/logger.service';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setContext(SchedulerService.name);
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleTrialEndingEmails() {
    this.loggerService.log('Verificando trials que estão expirando...');

    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const expiringSubscriptions = await this.subscriptionsRepository.findMany({
      where: {
        isTrial: true,
        isActive: true,
        trialEndsAt: {
          gte: now,
          lte: twoDaysFromNow,
        },
      },
    });

    this.loggerService.log(
      `Encontradas ${expiringSubscriptions.length} assinaturas trial expirando`,
    );

    for (const subscription of expiringSubscriptions) {
      const user = await this.usersRepository.findUnique({
        where: { id: subscription.userId },
        select: { name: true, email: true },
      });

      if (!user) continue;

      const daysRemaining = Math.ceil(
        (subscription.trialEndsAt!.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      this.notificationsService.notify({
        userId: subscription.userId,
        type: 'TRIAL_ENDING',
        channel: 'BOTH',
        title: 'Seu trial está acabando!',
        message: `Seu período de trial expira em ${daysRemaining} dias.`,
        email: {
          to: user.email,
          subject: 'Seu trial está acabando — myCash',
          template: 'trial-ending',
          variables: {
            name: user.name,
            daysRemaining: String(daysRemaining),
          },
        },
      });
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async cleanupOldNotifications() {
    this.loggerService.log('Limpando notificações antigas...');

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 45);

    const result = await this.notificationsRepository.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    this.loggerService.log(`${result.count} notificações antigas removidas`);
  }
}
