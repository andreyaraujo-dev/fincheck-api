import { Injectable } from '@nestjs/common';
import { GoalsRepository } from '../../../shared/database/repositories/goals.repository';
import { GoalOperationsRepository } from '../../../shared/database/repositories/goal-operations.repository';
import { TransactionsRepository } from '../../../shared/database/repositories/transactions.repository';
import { ValidateGoalOwnershipService } from './validate-goal-ownership.service';
import { ValidateCategoryOwnershipService } from '../../categories/services/validate-category-ownership.service';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { UpdateGoalDto } from '../dto/update-goal.dto';
import {
  GoalStatus,
  GoalImportance,
  GoalPriority,
} from '../entities/goal.entity';

interface GoalsFilters {
  name?: string;
  status?: GoalStatus;
  categoryId?: string;
  importance?: GoalImportance;
  priority?: GoalPriority;
  dueDateFrom?: string;
  dueDateTo?: string;
}

@Injectable()
export class GoalsService {
  constructor(
    private readonly goalsRepository: GoalsRepository,
    private readonly goalOperationsRepository: GoalOperationsRepository,
    private readonly transactionsRepository: TransactionsRepository,
    private readonly validateGoalOwnershipService: ValidateGoalOwnershipService,
    private readonly validateCategoryOwnershipService: ValidateCategoryOwnershipService,
  ) {}

  async create(userId: string, createGoalDto: CreateGoalDto) {
    const {
      name,
      description,
      targetValue,
      dueDate,
      status,
      categoryId,
      importance,
      priority,
    } = createGoalDto;

    await this.validateCategoryOwnershipService.validate(userId, categoryId);

    return this.goalsRepository.create({
      data: {
        userId,
        categoryId,
        name,
        description,
        targetValue,
        dueDate,
        status,
        importance,
        priority,
      },
    });
  }

  async findAllByUserId(userId: string, filters?: GoalsFilters) {
    const where: any = { userId };

    if (filters) {
      if (filters.name) {
        where.name = { contains: filters.name, mode: 'insensitive' };
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }

      if (filters.importance) {
        where.importance = filters.importance;
      }

      if (filters.priority) {
        where.priority = filters.priority;
      }

      if (filters.dueDateFrom || filters.dueDateTo) {
        where.dueDate = {};
        if (filters.dueDateFrom) {
          where.dueDate.gte = new Date(filters.dueDateFrom);
        }
        if (filters.dueDateTo) {
          where.dueDate.lte = new Date(filters.dueDateTo);
        }
      }
    }

    return this.goalsRepository.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            type: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async findOne(userId: string, goalId: string) {
    await this.validateGoalOwnershipService.validate(userId, goalId);

    return this.goalsRepository.findFirst({
      where: { id: goalId, userId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            type: true,
          },
        },
      },
    });
  }

  async update(userId: string, goalId: string, updateGoalDto: UpdateGoalDto) {
    const { categoryId, ...data } = updateGoalDto;

    await this.validateGoalOwnershipService.validate(userId, goalId);

    if (categoryId) {
      await this.validateCategoryOwnershipService.validate(userId, categoryId);
    }

    return this.goalsRepository.update({
      where: { id: goalId },
      data: {
        ...data,
        ...(categoryId && { categoryId }),
      },
    });
  }

  async remove(userId: string, goalId: string, deleteTransactions?: boolean) {
    await this.validateGoalOwnershipService.validate(userId, goalId);

    if (deleteTransactions) {
      const operations = await this.goalOperationsRepository.findMany({
        where: {
          goalId,
          transactionId: { not: null },
        },
      });

      const transactionIds = operations
        .map((op) => op.transactionId)
        .filter((id): id is string => id !== null);

      if (transactionIds.length > 0) {
        await this.transactionsRepository.deleteMany({
          where: { id: { in: transactionIds } },
        });
      }
    }

    await this.goalsRepository.delete({
      where: { id: goalId },
    });
  }

  async getProgress(goalId: string) {
    const goal = await this.goalsRepository.findFirst({
      where: { id: goalId },
    });

    if (!goal) {
      return null;
    }

    const percentage = (goal.currentValue / goal.targetValue) * 100;

    return {
      currentValue: goal.currentValue,
      targetValue: goal.targetValue,
      percentage: Math.min(percentage, 100),
      isCompleted: goal.currentValue >= goal.targetValue,
    };
  }
}
