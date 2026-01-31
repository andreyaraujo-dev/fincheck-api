import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../../../shared/database/repositories/categories.repository';
import { ValidateCategoryOwnershipService } from './validate-category-ownership.service';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { TransactionsService } from 'src/modules/transactions/services/transactions.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly validateCategoryOwnershipService: ValidateCategoryOwnershipService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    const { name, icon, type, budget } = createCategoryDto;

    return this.categoriesRepository.create({
      data: { userId, name, icon, type, budget },
    });
  }

  async findAllCategoriesWithTransactionsData(userId: string) {
    const categories = await this.categoriesRepository.findMany({
      where: { userId },
    });

    const transactions = await this.transactionsService.findAllByUserId(
      userId,
      {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    );

    // Agrupar transações por categoria e calcular gastos
    const categorySpendingMap = new Map<
      string,
      { total: number; count: number }
    >();

    for (const transaction of transactions as any[]) {
      const categoryId = transaction.categoryId;
      if (!categoryId) continue;

      const current = categorySpendingMap.get(categoryId) || {
        total: 0,
        count: 0,
      };
      categorySpendingMap.set(categoryId, {
        total: current.total + Number(transaction.value),
        count: current.count + 1,
      });
    }

    // Calcular totais
    const totalCategories = categories.length;
    const totalBudget = categories.reduce(
      (sum, cat) => sum + (cat.budget || 0),
      0,
    );
    const totalSpending = Array.from(categorySpendingMap.values()).reduce(
      (sum, data) => sum + data.total,
      0,
    );

    // Montar dados por categoria
    const categoriesData = categories.map((category) => {
      const spendingData = categorySpendingMap.get(category.id) || {
        total: 0,
        count: 0,
      };
      const spending = spendingData.total;
      const transactionCount = spendingData.count;
      const budget = category.budget || 0;

      // Calcular porcentagem usada
      const percentageUsed =
        budget > 0 ? Math.round((spending / budget) * 100) : 0;

      // Determinar status
      let status: 'normal' | 'attention' | 'critical';
      if (percentageUsed >= 90) {
        status = 'critical';
      } else if (percentageUsed >= 80) {
        status = 'attention';
      } else {
        status = 'normal';
      }

      // Calcular valor restante
      const remaining = Math.max(0, budget - spending);

      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        type: category.type,
        transactionCount,
        spending,
        budget,
        percentageUsed,
        status,
        remaining,
      };
    });

    return {
      summary: {
        totalCategories,
        totalBudget,
        totalSpending,
      },
      categories: categoriesData,
    };
  }

  async findAllByUserId(userId: string) {
    return this.categoriesRepository.findMany({ where: { userId: userId } });
  }

  async findOne(userId: string, categoryId: string) {
    await this.validateCategoryOwnershipService.validate(userId, categoryId);

    return this.categoriesRepository.findFirst({
      where: { id: categoryId, userId: userId },
    });
  }

  async update(
    userId: string,
    categoryId: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    await this.validateCategoryOwnershipService.validate(userId, categoryId);

    return this.categoriesRepository.update({
      where: { id: categoryId, userId: userId },
      data: updateCategoryDto,
    });
  }

  async delete(userId: string, categoryId: string) {
    await this.validateCategoryOwnershipService.validate(userId, categoryId);

    return this.categoriesRepository.delete({
      where: { id: categoryId, userId: userId },
    });
  }
}
