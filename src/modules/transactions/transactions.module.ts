import { forwardRef, Module } from '@nestjs/common';
import { TransactionsService } from './services/transactions.service';
import { SimulationService } from './services/simulation.service';
import { TransactionsController } from './transactions.controller';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { ValidateTransactionOwnershipService } from './services/validate-transaction-ownership.service';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [BankAccountsModule, forwardRef(() => CategoriesModule)],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    SimulationService,
    ValidateTransactionOwnershipService,
  ],
  exports: [TransactionsService],
})
export class TransactionsModule {}
