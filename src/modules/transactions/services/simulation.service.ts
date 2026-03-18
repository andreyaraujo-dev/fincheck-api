import { Injectable } from '@nestjs/common';
import { TransactionsRepository } from '../../../shared/database/repositories/transactions.repository';
import { BankAccountsRepository } from '../../../shared/database/repositories/bank-accounts.repository';
import { CategoriesRepository } from '../../../shared/database/repositories/categories.repository';
import { GoalsRepository } from '../../../shared/database/repositories/goals.repository';
import { ValidateBankAccountOwnershipService } from '../../bank-accounts/services/validate-bank-account-ownership.service';
import { TransactionType } from '../entities/transaction';
import { SimulateQueryDto } from '../dto/simulate-query.dto';

interface RecurringGroup {
  recurrenceGroupId: string;
  value: number;
  type: string;
  categoryId: string | null;
  recurrenceEndDate: Date | null;
}

@Injectable()
export class SimulationService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly bankAccountsRepository: BankAccountsRepository,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly goalsRepository: GoalsRepository,
    private readonly validateBankAccountOwnershipService: ValidateBankAccountOwnershipService,
  ) {}

  async run(userId: string, query: SimulateQueryDto) {
    const period = query.period ?? 12;

    if (query.bankAccountId) {
      await this.validateBankAccountOwnershipService.validate(
        userId,
        query.bankAccountId,
      );
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const bankAccountId = query.bankAccountId;

    const [
      bankAccounts,
      paidTransactions,
      currentMonthTransactions,
      categories,
      goals,
    ] = await Promise.all([
      this.bankAccountsRepository.findMany({
        where: { userId },
        select: { id: true, name: true, initialBalance: true },
      }),
      this.transactionsRepository.findPaidUntilDate(userId, now, bankAccountId),
      this.transactionsRepository.findMonthTransactions(
        userId,
        currentMonth,
        currentYear,
        bankAccountId,
      ),
      this.categoriesRepository.findMany({
        where: { userId },
        select: { id: true, name: true, budget: true },
      }),
      this.goalsRepository.findMany({
        where: { userId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        select: {
          id: true,
          name: true,
          targetValue: true,
          currentValue: true,
          dueDate: true,
        },
      }),
    ]);

    const {
      recurringGroups,
      fallbackIncome,
      fallbackExpense,
      oneTimeIncome,
      oneTimeExpense,
    } = this.buildBaseFromCurrentMonth(currentMonthTransactions);

    const balanceByAccount = this.computeInitialBalances(
      bankAccounts,
      paidTransactions,
    );
    const totalInitialBalance = bankAccountId
      ? (balanceByAccount[bankAccountId] ?? 0)
      : Object.values(balanceByAccount).reduce((a, b) => a + b, 0);

    const baseProjection = this.buildProjection(
      period,
      totalInitialBalance,
      recurringGroups,
      fallbackIncome,
      fallbackExpense,
      oneTimeIncome,
      oneTimeExpense,
      null,
    );

    const simulatedProjection = this.buildProjection(
      period,
      totalInitialBalance,
      recurringGroups,
      fallbackIncome,
      fallbackExpense,
      oneTimeIncome,
      oneTimeExpense,
      query,
    );

    const budgetImpact = this.computeBudgetImpact(
      categories,
      recurringGroups,
      baseProjection,
      simulatedProjection,
      query,
    );

    const goalsImpact = this.computeGoalsImpact(
      goals,
      baseProjection,
      simulatedProjection,
    );

    return {
      baseProjection,
      simulatedProjection,
      budgetImpact,
      goalsImpact,
    };
  }

  private buildBaseFromCurrentMonth(
    transactions: Array<{
      type: string;
      value: number;
      categoryId: string | null;
      recurrenceGroupId: string | null;
      recurrenceEndDate: Date | null;
    }>,
  ): {
    recurringGroups: RecurringGroup[];
    fallbackIncome: number;
    fallbackExpense: number;
    oneTimeIncome: number;
    oneTimeExpense: number;
  } {
    const groupsByGroupId = new Map<string, RecurringGroup>();
    let oneTimeIncome = 0;
    let oneTimeExpense = 0;

    for (const t of transactions) {
      const value = Number(t.value);
      if (t.recurrenceGroupId) {
        const existing = groupsByGroupId.get(t.recurrenceGroupId);
        if (existing) {
          existing.value += value;
        } else {
          groupsByGroupId.set(t.recurrenceGroupId, {
            recurrenceGroupId: t.recurrenceGroupId,
            value,
            type: t.type,
            categoryId: t.categoryId,
            recurrenceEndDate: t.recurrenceEndDate,
          });
        }
      } else {
        if (t.type === 'INCOME') oneTimeIncome += value;
        else oneTimeExpense += value;
      }
    }

    const recurringGroups = Array.from(groupsByGroupId.values());
    const recurringIncome = recurringGroups
      .filter((g) => g.type === 'INCOME')
      .reduce((s, g) => s + g.value, 0);
    const recurringExpense = recurringGroups
      .filter((g) => g.type === 'EXPENSE')
      .reduce((s, g) => s + g.value, 0);

    return {
      recurringGroups,
      fallbackIncome: recurringIncome + oneTimeIncome,
      fallbackExpense: recurringExpense + oneTimeExpense,
      oneTimeIncome,
      oneTimeExpense,
    };
  }

  private isRecurringActiveInMonth(
    group: RecurringGroup,
    month: number,
    year: number,
  ): boolean {
    if (!group.recurrenceEndDate) return true;
    const lastDayOfMonth = new Date(year, month, 0);
    return group.recurrenceEndDate >= lastDayOfMonth;
  }

  private computeInitialBalances(
    bankAccounts: Array<{ id: string; initialBalance: number }>,
    paidTransactions: Array<{
      bankAccountId: string;
      type: string;
      value: number;
    }>,
  ): Record<string, number> {
    const balances: Record<string, number> = {};
    for (const acc of bankAccounts) {
      balances[acc.id] = Number(acc.initialBalance);
    }
    for (const t of paidTransactions) {
      const delta = t.type === 'INCOME' ? Number(t.value) : -Number(t.value);
      balances[t.bankAccountId] = (balances[t.bankAccountId] ?? 0) + delta;
    }
    return balances;
  }

  private buildProjection(
    period: number,
    initialBalance: number,
    recurringGroups: RecurringGroup[],
    fallbackIncome: number,
    fallbackExpense: number,
    oneTimeIncome: number,
    oneTimeExpense: number,
    simulation: SimulateQueryDto | null,
  ): Array<{
    month: number;
    year: number;
    balance: number;
    income: number;
    expense: number;
    simulatedDelta?: number;
  }> {
    const simDate = simulation ? new Date(simulation.date) : null;
    const excludeGroupId = simulation?.recurrenceGroupId ?? null;

    const result: Array<{
      month: number;
      year: number;
      balance: number;
      income: number;
      expense: number;
      simulatedDelta?: number;
    }> = [];

    let balance = initialBalance;
    const now = new Date();

    for (let i = 0; i < period; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();

      let income = 0;
      let expense = 0;

      if (recurringGroups.length > 0) {
        for (const g of recurringGroups) {
          if (!this.isRecurringActiveInMonth(g, month, year)) continue;
          if (
            excludeGroupId &&
            g.recurrenceGroupId === excludeGroupId &&
            simDate
          ) {
            const simMonth = simDate.getMonth() + 1;
            const simYear = simDate.getFullYear();
            if (year > simYear || (year === simYear && month >= simMonth)) {
              continue;
            }
          }
          if (g.type === 'INCOME') income += g.value;
          else expense += g.value;
        }
        income += oneTimeIncome;
        expense += oneTimeExpense;
      } else {
        income = fallbackIncome;
        expense = fallbackExpense;
      }

      let simulatedDelta = 0;
      if (simulation) {
        const simMonth = simDate!.getMonth() + 1;
        const simYear = simDate!.getFullYear();
        const isSimActive =
          year > simYear || (year === simYear && month >= simMonth);

        if (isSimActive) {
          if (simulation.type === TransactionType.INCOME) {
            income += simulation.value;
            simulatedDelta = simulation.value;
          } else {
            if (
              simulation.entrada !== undefined &&
              simulation.parcels &&
              simulation.parcels > 0
            ) {
              if (month === simMonth && year === simYear) {
                expense += simulation.entrada;
                simulatedDelta -= simulation.entrada;
              }
              const parcelValue = this.computeParcelValue(simulation);
              const monthsOfParcels = simulation.parcels;
              const monthsFromStart =
                (year - simYear) * 12 + (month - simMonth);
              if (monthsFromStart >= 1 && monthsFromStart <= monthsOfParcels) {
                expense += parcelValue;
                simulatedDelta -= parcelValue;
              }
            } else if (simulation.recurrenceGroupId) {
              // Quitação por grupo: simulatedDelta = valor economizado (positivo)
              const removedGroup = recurringGroups.find(
                (g) => g.recurrenceGroupId === simulation.recurrenceGroupId,
              );
              if (removedGroup?.type === 'EXPENSE') {
                simulatedDelta = removedGroup.value;
              }
            } else if (simulation.parcels && simulation.value) {
              const monthsFromStart =
                (year - simYear) * 12 + (month - simMonth);
              if (
                monthsFromStart >= 0 &&
                monthsFromStart < simulation.parcels
              ) {
                expense += simulation.value;
                simulatedDelta = -simulation.value;
              }
            }
          }
        }
      }

      const isFirstMonth = i === 0;
      if (!isFirstMonth) {
        balance = balance + income - expense;
      }
      result.push({
        month,
        year,
        balance: Math.round(balance * 100) / 100,
        income: Math.round(income * 100) / 100,
        expense: Math.round(expense * 100) / 100,
        simulatedDelta:
          simulation !== null ? Math.round(simulatedDelta * 100) / 100 : 0,
      });
    }

    return result;
  }

  private computeParcelValue(query: SimulateQueryDto): number {
    if (query.juros !== undefined && query.juros > 0 && query.parcels) {
      const P = query.value - (query.entrada ?? 0);
      const i = query.juros / 100;
      const n = query.parcels;
      if (i === 0) return P / n;
      return (P * (i * Math.pow(1 + i, n))) / (Math.pow(1 + i, n) - 1);
    }
    return query.parcels ? query.value / query.parcels : query.value;
  }

  private computeBudgetImpact(
    categories: Array<{ id: string; name: string; budget: number | null }>,
    recurringGroups: RecurringGroup[],
    baseProjection: Array<{ month: number; year: number }>,
    simulatedProjection: Array<{
      month: number;
      year: number;
      expense: number;
    }>,
    query: SimulateQueryDto,
  ): Array<{
    categoryId: string;
    categoryName: string;
    monthsOverBudget: Array<{
      month: number;
      year: number;
      spending: number;
      budget: number;
    }>;
  }> {
    const result: Array<{
      categoryId: string;
      categoryName: string;
      monthsOverBudget: Array<{
        month: number;
        year: number;
        spending: number;
        budget: number;
      }>;
    }> = [];

    const catsWithBudget = categories.filter(
      (c) => c.budget != null && c.budget > 0,
    );
    if (catsWithBudget.length === 0) return result;

    const spendingByCategoryMonth = new Map<string, Map<string, number>>();

    for (const proj of simulatedProjection) {
      const key = `${proj.year}-${proj.month}`;
      const byCat = new Map<string, number>();

      for (const g of recurringGroups) {
        if (g.type !== 'EXPENSE') continue;
        if (!this.isRecurringActiveInMonth(g, proj.month, proj.year)) continue;
        if (
          query.recurrenceGroupId &&
          g.recurrenceGroupId === query.recurrenceGroupId &&
          this.isSimMonthOrAfter(proj.month, proj.year, query.date)
        ) {
          continue;
        }
        const cid = g.categoryId ?? 'uncategorized';
        byCat.set(cid, (byCat.get(cid) ?? 0) + g.value);
      }

      if (query.type === TransactionType.EXPENSE && query.categoryId) {
        const simDate = new Date(query.date);
        const isActive =
          proj.year > simDate.getFullYear() ||
          (proj.year === simDate.getFullYear() &&
            proj.month >= simDate.getMonth() + 1);
        if (isActive) {
          if (
            query.entrada !== undefined &&
            query.parcels &&
            query.parcels > 0
          ) {
            if (
              proj.month === simDate.getMonth() + 1 &&
              proj.year === simDate.getFullYear()
            ) {
              byCat.set(
                query.categoryId,
                (byCat.get(query.categoryId) ?? 0) + (query.entrada ?? 0),
              );
            }
            const parcelValue = this.computeParcelValue(query);
            const monthsFromStart =
              (proj.year - simDate.getFullYear()) * 12 +
              (proj.month - (simDate.getMonth() + 1));
            if (
              monthsFromStart >= 1 &&
              monthsFromStart <= (query.parcels ?? 0)
            ) {
              byCat.set(
                query.categoryId,
                (byCat.get(query.categoryId) ?? 0) + parcelValue,
              );
            }
          } else if (query.parcels && query.value) {
            const monthsFromStart =
              (proj.year - simDate.getFullYear()) * 12 +
              (proj.month - (simDate.getMonth() + 1));
            if (monthsFromStart >= 0 && monthsFromStart < query.parcels) {
              byCat.set(
                query.categoryId,
                (byCat.get(query.categoryId) ?? 0) + query.value,
              );
            }
          }
        }
      }
      spendingByCategoryMonth.set(key, byCat);
    }

    for (const cat of catsWithBudget) {
      const budget = Number(cat.budget);
      const monthsOverBudget: Array<{
        month: number;
        year: number;
        spending: number;
        budget: number;
      }> = [];

      for (const proj of simulatedProjection) {
        const key = `${proj.year}-${proj.month}`;
        const byCat = spendingByCategoryMonth.get(key);
        const spending = byCat?.get(cat.id) ?? 0;
        if (spending > budget) {
          monthsOverBudget.push({
            month: proj.month,
            year: proj.year,
            spending: Math.round(spending * 100) / 100,
            budget,
          });
        }
      }

      if (monthsOverBudget.length > 0) {
        result.push({
          categoryId: cat.id,
          categoryName: cat.name,
          monthsOverBudget,
        });
      }
    }

    return result;
  }

  private isSimMonthOrAfter(
    month: number,
    year: number,
    dateStr: string,
  ): boolean {
    const simDate = new Date(dateStr);
    const simMonth = simDate.getMonth() + 1;
    const simYear = simDate.getFullYear();
    return year > simYear || (year === simYear && month >= simMonth);
  }

  private computeGoalsImpact(
    goals: Array<{
      id: string;
      name: string;
      targetValue: number;
      currentValue: number;
      dueDate: Date;
    }>,
    baseProjection: Array<{
      month: number;
      year: number;
      balance: number;
      income: number;
      expense: number;
    }>,
    simulatedProjection: Array<{
      month: number;
      year: number;
      balance: number;
      income: number;
      expense: number;
    }>,
  ): Array<{
    goalId: string;
    goalName: string;
    newEstimatedDueDate?: string;
    impactOnTarget?: string;
  }> {
    const result: Array<{
      goalId: string;
      goalName: string;
      newEstimatedDueDate?: string;
      impactOnTarget?: string;
    }> = [];

    for (const goal of goals) {
      const remaining = Number(goal.targetValue) - Number(goal.currentValue);
      if (remaining <= 0) continue;

      const baseSavings = baseProjection.map(
        (p) => Number(p.income) - Number(p.expense),
      );
      const simSavings = simulatedProjection.map(
        (p) => Number(p.income) - Number(p.expense),
      );

      const baseCumulative = this.cumulativeSavings(baseSavings);
      const simCumulative = this.cumulativeSavings(simSavings);

      const baseMonths = this.monthsToReach(baseCumulative, remaining);
      const simMonths = this.monthsToReach(simCumulative, remaining);

      const startDate = new Date();
      const baseDue = new Date(startDate);
      baseDue.setMonth(baseDue.getMonth() + baseMonths);
      const simDue = new Date(startDate);
      simDue.setMonth(simDue.getMonth() + simMonths);

      const impactOnTarget =
        simMonths < baseMonths
          ? `${baseMonths - simMonths} meses mais rápido`
          : simMonths > baseMonths
            ? `${simMonths - baseMonths} meses mais lento`
            : 'Sem alteração';

      result.push({
        goalId: goal.id,
        goalName: goal.name,
        newEstimatedDueDate: simDue.toISOString().split('T')[0],
        impactOnTarget,
      });
    }

    return result;
  }

  private cumulativeSavings(monthly: number[]): number[] {
    const result: number[] = [];
    let sum = 0;
    for (const m of monthly) {
      sum += m;
      result.push(sum);
    }
    return result;
  }

  private monthsToReach(cumulative: number[], target: number): number {
    for (let i = 0; i < cumulative.length; i++) {
      if (cumulative[i] >= target) return i + 1;
    }
    return cumulative.length;
  }
}
