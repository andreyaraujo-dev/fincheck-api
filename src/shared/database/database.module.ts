import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UsersRepository } from './repositories/users.repository';
import { CategoriesRepository } from './repositories/categories.repository';
import { BankAccountsRepository } from './repositories/bank-accounts.repository';
import { TransactionsRepository } from './repositories/transactions.repository';
import { GoalsRepository } from './repositories/goals.repository';
import { GoalOperationsRepository } from './repositories/goal-operations.repository';
import { SubscriptionsRepository } from './repositories/subscriptions.repository';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationReadsRepository } from './repositories/notification-reads.repository';

@Global()
@Module({
  providers: [
    PrismaService,
    UsersRepository,
    CategoriesRepository,
    BankAccountsRepository,
    TransactionsRepository,
    GoalsRepository,
    GoalOperationsRepository,
    SubscriptionsRepository,
    NotificationsRepository,
    NotificationReadsRepository,
  ],
  exports: [
    UsersRepository,
    CategoriesRepository,
    BankAccountsRepository,
    TransactionsRepository,
    GoalsRepository,
    GoalOperationsRepository,
    SubscriptionsRepository,
    NotificationsRepository,
    NotificationReadsRepository,
  ],
})
export class DatabaseModule {}
