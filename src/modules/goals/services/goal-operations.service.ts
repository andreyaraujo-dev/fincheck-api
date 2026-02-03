import { Injectable, BadRequestException } from '@nestjs/common';
import { GoalOperationsRepository } from '../../../shared/database/repositories/goal-operations.repository';
import { GoalsRepository } from '../../../shared/database/repositories/goals.repository';
import { ValidateGoalOwnershipService } from './validate-goal-ownership.service';
import { ValidateBankAccountOwnershipService } from '../../bank-accounts/services/validate-bank-account-ownership.service';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { CreateGoalOperationDto } from '../dto/create-goal-operation.dto';
import { GoalOperationType } from '../entities/goal-operation.entity';
import { TransactionType } from '../../transactions/entities/transaction';
import { GoalStatus } from '../entities/goal.entity';

@Injectable()
export class GoalOperationsService {
  constructor(
    private readonly goalOperationsRepository: GoalOperationsRepository,
    private readonly goalsRepository: GoalsRepository,
    private readonly validateGoalOwnershipService: ValidateGoalOwnershipService,
    private readonly validateBankAccountOwnershipService: ValidateBankAccountOwnershipService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async createOperation(
    userId: string,
    goalId: string,
    createOperationDto: CreateGoalOperationDto,
  ) {
    const { type, value, bankAccountId, description } = createOperationDto;

    // Validar ownership da meta
    await this.validateGoalOwnershipService.validate(userId, goalId);

    // Buscar meta
    const goal = await this.goalsRepository.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new BadRequestException('Goal not found');
    }

    // Verificar se meta não está cancelada
    if (goal.status === GoalStatus.CANCELLED) {
      throw new BadRequestException('Cannot operate on cancelled goal');
    }

    // Validar tipo de operação
    if (
      (type === GoalOperationType.DEPOSIT ||
        type === GoalOperationType.WITHDRAW) &&
      !bankAccountId
    ) {
      throw new BadRequestException(
        'Bank account is required for DEPOSIT and WITHDRAW operations',
      );
    }

    // Se bankAccountId fornecido, validar ownership
    if (bankAccountId) {
      await this.validateBankAccountOwnershipService.validate(
        userId,
        bankAccountId,
      );
    }

    // Calcular novo currentValue
    let newCurrentValue = goal.currentValue;

    if (type === GoalOperationType.DEPOSIT) {
      newCurrentValue += value;
    } else if (type === GoalOperationType.WITHDRAW) {
      newCurrentValue -= value;
      // Validar se não fica negativo
      if (newCurrentValue < 0) {
        throw new BadRequestException(
          'Insufficient funds in goal to withdraw this amount',
        );
      }
    } else if (type === GoalOperationType.MANUAL) {
      // Para operação manual, o value pode ser positivo ou negativo
      // Mas vamos considerar que sempre é positivo e o tipo define a direção
      newCurrentValue += value;
    }

    // Criar transação se for DEPOSIT ou WITHDRAW
    let transactionId: string | undefined;

    if (type === GoalOperationType.DEPOSIT && bankAccountId) {
      // DEPOSIT: cria transação tipo EXPENSE (saiu da conta)
      const transaction = await this.transactionsService.create(userId, {
        name: `Meta: ${goal.name}`,
        value,
        date: new Date().toISOString(),
        type: TransactionType.EXPENSE,
        bankAccountId,
        categoryId: goal.categoryId,
        isPaid: true,
      });
      transactionId = transaction.id;
    } else if (type === GoalOperationType.WITHDRAW && bankAccountId) {
      // WITHDRAW: cria transação tipo INCOME (voltou pra conta)
      const transaction = await this.transactionsService.create(userId, {
        name: `Meta: ${goal.name}`,
        value,
        date: new Date().toISOString(),
        type: TransactionType.INCOME,
        bankAccountId,
        categoryId: goal.categoryId,
        isPaid: true,
      });
      transactionId = transaction.id;
    }

    // Criar registro de operação
    const operation = await this.goalOperationsRepository.create({
      data: {
        goalId,
        type,
        value,
        bankAccountId,
        transactionId,
        description,
      },
      include: {
        bankAccount: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Atualizar currentValue da meta
    const updatedGoal = await this.goalsRepository.update({
      where: { id: goalId },
      data: {
        currentValue: newCurrentValue,
      },
    });

    // Verificar se meta foi completada
    if (
      updatedGoal.currentValue >= updatedGoal.targetValue &&
      updatedGoal.status !== GoalStatus.COMPLETED
    ) {
      await this.goalsRepository.update({
        where: { id: goalId },
        data: {
          status: GoalStatus.COMPLETED,
        },
      });
    }

    return operation;
  }

  async getOperations(userId: string, goalId: string) {
    await this.validateGoalOwnershipService.validate(userId, goalId);

    return this.goalOperationsRepository.findMany({
      where: { goalId },
      include: {
        bankAccount: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
