import { ApiProperty } from '@nestjs/swagger';

class PeriodDto {
  @ApiProperty({ example: '2026-01-01' })
  startDate: string;

  @ApiProperty({ example: '2026-01-31' })
  endDate: string;

  @ApiProperty({ description: 'Total de receitas', example: 8500.00 })
  income: number;

  @ApiProperty({ description: 'Total de despesas', example: 5200.00 })
  expense: number;
}

class IncomeExpenseComparisonDto {
  @ApiProperty({ description: 'Variação percentual de receita', example: 12.5 })
  incomeChange: number;

  @ApiProperty({ description: 'Variação absoluta de receita', example: 950.00 })
  incomeChangeAbsolute: number;

  @ApiProperty({ description: 'Variação percentual de despesa', example: -3.2 })
  expenseChange: number;

  @ApiProperty({ description: 'Variação absoluta de despesa', example: -170.00 })
  expenseChangeAbsolute: number;
}

export class IncomeExpensesResponseDto {
  @ApiProperty({ type: PeriodDto })
  currentPeriod: PeriodDto;

  @ApiProperty({ type: PeriodDto })
  previousPeriod: PeriodDto;

  @ApiProperty({ type: IncomeExpenseComparisonDto })
  comparison: IncomeExpenseComparisonDto;
}

class MonthlyBalanceDto {
  @ApiProperty({ example: 1 })
  month: number;

  @ApiProperty({ example: 2026 })
  year: number;

  @ApiProperty({ example: 12500.00 })
  balance: number;
}

class AverageBalancePeriodDto {
  @ApiProperty({ example: 9 })
  startMonth: number;

  @ApiProperty({ example: 2025 })
  startYear: number;

  @ApiProperty({ example: 2 })
  endMonth: number;

  @ApiProperty({ example: 2026 })
  endYear: number;
}

export class AverageBalanceResponseDto {
  @ApiProperty({ description: 'Saldo médio no período', example: 11250.00 })
  averageBalance: number;

  @ApiProperty({ type: AverageBalancePeriodDto })
  period: AverageBalancePeriodDto;

  @ApiProperty({ type: [MonthlyBalanceDto] })
  monthlyBalances: MonthlyBalanceDto[];
}

class DateRangeDto {
  @ApiProperty({ example: '2026-01-01' })
  startDate: string;

  @ApiProperty({ example: '2026-01-31' })
  endDate: string;
}

class SavingsComparisonDto {
  @ApiProperty({ description: 'Taxa do período anterior', example: 35.2 })
  previousRate: number;

  @ApiProperty({ description: 'Variação percentual da taxa', example: 3.5 })
  rateChange: number;

  @ApiProperty({ description: 'Variação absoluta da taxa', example: 1.3 })
  rateChangeAbsolute: number;
}

export class SavingsRateResponseDto {
  @ApiProperty({ type: DateRangeDto })
  period: DateRangeDto;

  @ApiProperty({ description: 'Total de receitas', example: 8500.00 })
  income: number;

  @ApiProperty({ description: 'Total de despesas', example: 5200.00 })
  expense: number;

  @ApiProperty({ description: 'Valor poupado', example: 3300.00 })
  saved: number;

  @ApiProperty({ description: 'Taxa de poupança em percentual', example: 38.8 })
  savingsRate: number;

  @ApiProperty({ type: SavingsComparisonDto })
  comparison: SavingsComparisonDto;
}

class ExpenseCategoryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  categoryId: string;

  @ApiProperty({ example: 'Alimentação' })
  categoryName: string;

  @ApiProperty({ example: 'food' })
  categoryIcon: string;

  @ApiProperty({ description: 'Total gasto na categoria', example: 1200.00 })
  amount: number;

  @ApiProperty({ description: 'Percentual do total de despesas', example: 23.1 })
  percentage: number;

  @ApiProperty({ description: 'Quantidade de transações', example: 28 })
  transactionCount: number;
}

export class ExpensesByCategoryResponseDto {
  @ApiProperty({ type: DateRangeDto })
  period: DateRangeDto;

  @ApiProperty({ description: 'Total de despesas no período', example: 5200.00 })
  totalExpenses: number;

  @ApiProperty({ type: [ExpenseCategoryDto] })
  categories: ExpenseCategoryDto[];
}
