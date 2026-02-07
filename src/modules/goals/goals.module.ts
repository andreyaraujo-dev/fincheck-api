import { Module, forwardRef } from '@nestjs/common';
import { GoalsService } from './services/goals.service';
import { GoalOperationsService } from './services/goal-operations.service';
import { GoalsController } from './goals.controller';
import { ValidateGoalOwnershipService } from './services/validate-goal-ownership.service';
import { CategoriesModule } from '../categories/categories.module';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [CategoriesModule, BankAccountsModule, TransactionsModule],
  controllers: [GoalsController],
  providers: [
    GoalsService,
    GoalOperationsService,
    ValidateGoalOwnershipService,
  ],
  exports: [GoalsService, ValidateGoalOwnershipService],
})
export class GoalsModule {}
