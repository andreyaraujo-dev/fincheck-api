import { Injectable } from '@nestjs/common';
import { TransactionsRepository } from '../../shared/database/repositories/transactions.repository';
import { BankAccountsRepository } from '../../shared/database/repositories/bank-accounts.repository';
import { CategoriesRepository } from '../../shared/database/repositories/categories.repository';

@Injectable()
export class ReportsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly bankAccountsRepository: BankAccountsRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  // Métodos auxiliares privados

  private parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Retorna o intervalo de datas para consulta.
   * Se startDate e endDate não forem fornecidos, retorna o mês atual.
   * O end retornado é exclusivo (para uso com `lt` nas queries).
   */
  private getDateRange(
    startDate?: string,
    endDate?: string,
  ): { start: Date; end: Date } {
    if (startDate && endDate) {
      const start = this.parseDate(startDate);
      const end = this.parseDate(endDate);
      // Tornar end exclusivo (+1 dia) para uso nas queries
      end.setDate(end.getDate() + 1);
      return { start, end };
    }

    // Padrão: mês atual
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  /**
   * Calcula o período anterior com a mesma duração,
   * imediatamente antes do período atual.
   */
  private getPreviousDateRange(
    start: Date,
    end: Date,
  ): { start: Date; end: Date } {
    const durationMs = end.getTime() - start.getTime();
    return {
      start: new Date(start.getTime() - durationMs),
      end: new Date(start.getTime()),
    };
  }

  /**
   * Retorna as datas formatadas para a resposta (end inclusivo).
   */
  private getResponsePeriod(
    start: Date,
    end: Date,
  ): { startDate: string; endDate: string } {
    const inclusiveEnd = new Date(end);
    inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
    return {
      startDate: this.formatDate(start),
      endDate: this.formatDate(inclusiveEnd),
    };
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private getLast6MonthsPeriods(): Array<{ month: number; year: number }> {
    const periods: Array<{ month: number; year: number }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      });
    }

    return periods;
  }

  private getMonthDateRange(
    month: number,
    year: number,
  ): { startDate: Date; endDate: Date } {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    return { startDate, endDate };
  }

  // Métodos públicos para cada endpoint

  async getIncomeExpenses(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const { start, end } = this.getDateRange(startDate, endDate);
    const { start: prevStart, end: prevEnd } = this.getPreviousDateRange(
      start,
      end,
    );

    // Buscar dados do período atual
    const currentData = await this.getIncomeExpenseForRange(userId, start, end);

    // Buscar dados do período anterior
    const previousData = await this.getIncomeExpenseForRange(
      userId,
      prevStart,
      prevEnd,
    );

    // Calcular comparações
    const incomeChange = this.calculatePercentageChange(
      currentData.income,
      previousData.income,
    );
    const incomeChangeAbsolute = currentData.income - previousData.income;

    const expenseChange = this.calculatePercentageChange(
      currentData.expense,
      previousData.expense,
    );
    const expenseChangeAbsolute = currentData.expense - previousData.expense;

    return {
      currentPeriod: {
        ...this.getResponsePeriod(start, end),
        income: currentData.income,
        expense: currentData.expense,
      },
      previousPeriod: {
        ...this.getResponsePeriod(prevStart, prevEnd),
        income: previousData.income,
        expense: previousData.expense,
      },
      comparison: {
        incomeChange,
        incomeChangeAbsolute: Number(incomeChangeAbsolute.toFixed(2)),
        expenseChange,
        expenseChangeAbsolute: Number(expenseChangeAbsolute.toFixed(2)),
      },
    };
  }

  private async getIncomeExpenseForRange(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<{ income: number; expense: number }> {
    const result = await this.transactionsRepository.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
        isPaid: true,
      },
      select: {
        type: true,
        value: true,
      },
    });

    let income = 0;
    let expense = 0;

    result.forEach((transaction) => {
      if (transaction.type === 'INCOME') {
        income += Number(transaction.value);
      } else if (transaction.type === 'EXPENSE') {
        expense += Number(transaction.value);
      }
    });

    return {
      income: Number(income.toFixed(2)),
      expense: Number(expense.toFixed(2)),
    };
  }

  async getAverageBalance(userId: string) {
    const periods = this.getLast6MonthsPeriods();

    // Buscar saldos iniciais de todas as contas
    const bankAccounts = await this.bankAccountsRepository.findMany({
      where: { userId },
      select: {
        initialBalance: true,
      },
    });

    const totalInitialBalance = bankAccounts.reduce(
      (sum, account) => sum + Number(account.initialBalance),
      0,
    );

    // Calcular saldo para cada mês
    const monthlyBalances = await Promise.all(
      periods.map(async (period) => {
        const { endDate } = this.getMonthDateRange(period.month, period.year);

        // Buscar todas as transações até o final daquele mês
        const allTransactionsUntilMonth =
          await this.transactionsRepository.findMany({
            where: {
              userId,
              date: {
                lt: endDate,
              },
              isPaid: true,
            },
            select: {
              type: true,
              value: true,
            },
          });

        let totalIncome = 0;
        let totalExpense = 0;

        allTransactionsUntilMonth.forEach((transaction) => {
          if (transaction.type === 'INCOME') {
            totalIncome += Number(transaction.value);
          } else if (transaction.type === 'EXPENSE') {
            totalExpense += Number(transaction.value);
          }
        });

        const balance = totalInitialBalance + totalIncome - totalExpense;

        return {
          month: period.month,
          year: period.year,
          balance: Number(balance.toFixed(2)),
        };
      }),
    );

    // Calcular média
    const averageBalance =
      monthlyBalances.reduce((sum, item) => sum + item.balance, 0) /
      monthlyBalances.length;

    return {
      averageBalance: Number(averageBalance.toFixed(2)),
      period: {
        startMonth: periods[0].month,
        startYear: periods[0].year,
        endMonth: periods[periods.length - 1].month,
        endYear: periods[periods.length - 1].year,
      },
      monthlyBalances,
    };
  }

  async getSavingsRate(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const { start, end } = this.getDateRange(startDate, endDate);
    const { start: prevStart, end: prevEnd } = this.getPreviousDateRange(
      start,
      end,
    );

    // Calcular dados do período atual
    const currentData = await this.getIncomeExpenseForRange(userId, start, end);

    const saved = currentData.income - currentData.expense;
    const savingsRate =
      currentData.income > 0
        ? Math.round((saved / currentData.income) * 100)
        : 0;

    // Calcular dados do período anterior
    const previousData = await this.getIncomeExpenseForRange(
      userId,
      prevStart,
      prevEnd,
    );

    const previousSaved = previousData.income - previousData.expense;
    const previousRate =
      previousData.income > 0
        ? Math.round((previousSaved / previousData.income) * 100)
        : 0;

    const rateChange = savingsRate - previousRate;

    return {
      period: this.getResponsePeriod(start, end),
      income: currentData.income,
      expense: currentData.expense,
      saved: Number(saved.toFixed(2)),
      savingsRate,
      comparison: {
        previousRate,
        rateChange,
        rateChangeAbsolute: rateChange,
      },
    };
  }

  async getExpensesByCategory(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const { start, end } = this.getDateRange(startDate, endDate);

    // Buscar todas as transações de despesa do período
    const expenses = await this.transactionsRepository.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: {
          gte: start,
          lt: end,
        },
        isPaid: true,
      },
      select: {
        categoryId: true,
        value: true,
      },
    });

    // Buscar todas as categorias do usuário
    const categories = await this.categoriesRepository.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        icon: true,
      },
    });

    // Criar um mapa de categorias
    const categoryMap = new Map(
      categories.map((cat) => [cat.id, { name: cat.name, icon: cat.icon }]),
    );

    // Agrupar despesas por categoria
    const categoryTotals = new Map<
      string | null,
      { amount: number; count: number }
    >();

    expenses.forEach((expense) => {
      const categoryId = expense.categoryId;
      const current = categoryTotals.get(categoryId) || {
        amount: 0,
        count: 0,
      };
      categoryTotals.set(categoryId, {
        amount: current.amount + Number(expense.value),
        count: current.count + 1,
      });
    });

    // Calcular total de despesas
    const totalExpenses = Array.from(categoryTotals.values()).reduce(
      (sum, data) => sum + data.amount,
      0,
    );

    // Montar resultado
    const categoriesData = Array.from(categoryTotals.entries())
      .map(([categoryId, data]) => {
        const categoryInfo = categoryId ? categoryMap.get(categoryId) : null;

        return {
          categoryId: categoryId,
          categoryName: categoryInfo?.name || 'Sem categoria',
          categoryIcon: categoryInfo?.icon || '❓',
          amount: Number(data.amount.toFixed(2)),
          percentage:
            totalExpenses > 0
              ? Math.round((data.amount / totalExpenses) * 100)
              : 0,
          transactionCount: data.count,
        };
      })
      .sort((a, b) => b.amount - a.amount); // Ordenar por valor decrescente

    return {
      period: this.getResponsePeriod(start, end),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      categories: categoriesData,
    };
  }
}
