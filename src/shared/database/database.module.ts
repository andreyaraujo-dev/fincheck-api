import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UsersRepository } from './repositories/users.repository';
import { TrustedDevicesRepository } from './repositories/trusted-devices.repository';
import { CategoriesRepository } from './repositories/categories.repository';
import { BankAccountsRepository } from './repositories/bank-accounts.repository';
import { TransactionsRepository } from './repositories/transactions.repository';
import { GoalsRepository } from './repositories/goals.repository';
import { GoalOperationsRepository } from './repositories/goal-operations.repository';
import { SubscriptionsRepository } from './repositories/subscriptions.repository';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationReadsRepository } from './repositories/notification-reads.repository';
import { SharedPersonsRepository } from './repositories/shared-persons.repository';
import { SharedInvitesRepository } from './repositories/shared-invites.repository';
import { SharedAccessLogsRepository } from './repositories/shared-access-logs.repository';
import { PlansRepository } from './repositories/plans.repository';

@Global()
@Module({
  providers: [
    PrismaService,
    UsersRepository,
    TrustedDevicesRepository,
    CategoriesRepository,
    BankAccountsRepository,
    TransactionsRepository,
    GoalsRepository,
    GoalOperationsRepository,
    SubscriptionsRepository,
    NotificationsRepository,
    NotificationReadsRepository,
    SharedPersonsRepository,
    SharedInvitesRepository,
    SharedAccessLogsRepository,
    PlansRepository,
  ],
  exports: [
    PrismaService,
    UsersRepository,
    TrustedDevicesRepository,
    CategoriesRepository,
    BankAccountsRepository,
    TransactionsRepository,
    GoalsRepository,
    GoalOperationsRepository,
    SubscriptionsRepository,
    NotificationsRepository,
    NotificationReadsRepository,
    SharedPersonsRepository,
    SharedInvitesRepository,
    SharedAccessLogsRepository,
    PlansRepository,
  ],
})
export class DatabaseModule {}
