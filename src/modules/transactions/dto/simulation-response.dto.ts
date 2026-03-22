import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MonthlyProjectionDto {
  @ApiProperty({ example: 4 })
  month: number;

  @ApiProperty({ example: 2026 })
  year: number;

  @ApiProperty({ example: 15000.5 })
  balance: number;

  @ApiProperty({ example: 8000 })
  income: number;

  @ApiProperty({ example: 4500 })
  expense: number;

  @ApiPropertyOptional({
    description:
      'Entrada ou saída simulada no mês (positivo = receita, negativo = despesa)',
    example: -1000,
  })
  simulatedDelta?: number;
}

export class BudgetImpactDto {
  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  categoryName: string;

  @ApiProperty({
    type: [Object],
    description: 'Meses em que o orçamento foi estourado',
    example: [{ month: 5, year: 2026, spending: 1200, budget: 1000 }],
  })
  monthsOverBudget: Array<{
    month: number;
    year: number;
    spending: number;
    budget: number;
  }>;
}

export class GoalImpactDto {
  @ApiProperty()
  goalId: string;

  @ApiProperty()
  goalName: string;

  @ApiPropertyOptional({
    description: 'Nova data estimada para atingir a meta',
  })
  newEstimatedDueDate?: string;

  @ApiPropertyOptional({
    description: 'Impacto no valor alvo (ex: meses a menos para concluir)',
  })
  impactOnTarget?: string;
}

export class SimulationResponseDto {
  @ApiProperty({
    type: [MonthlyProjectionDto],
    description: 'Projeção base sem simulação',
  })
  baseProjection: MonthlyProjectionDto[];

  @ApiProperty({
    type: [MonthlyProjectionDto],
    description: 'Projeção com simulação aplicada',
  })
  simulatedProjection: MonthlyProjectionDto[];

  @ApiProperty({
    type: [BudgetImpactDto],
    description: 'Impacto em orçamentos por categoria',
  })
  budgetImpact: BudgetImpactDto[];

  @ApiProperty({
    type: [GoalImpactDto],
    description: 'Impacto nas metas financeiras',
  })
  goalsImpact: GoalImpactDto[];
}
