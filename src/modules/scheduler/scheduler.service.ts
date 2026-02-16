import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsRepository } from '../../shared/database/repositories/subscriptions.repository';
import { UsersRepository } from '../../shared/database/repositories/users.repository';
import { EmailService } from '../../shared/services/email/email.service';
import { LoggerService } from '../../shared/services/logger/logger.service';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
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

      this.emailService
        .sendEmail(
          user.email,
          'Seu trial está acabando — myCash',
          'trial-ending',
          {
            name: user.name,
            daysRemaining: String(daysRemaining),
          },
        )
        .catch(() => {});
    }
  }
}
