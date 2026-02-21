import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from 'src/modules/transactions/entities/transaction';

export class CategoryResponseDto {
  @ApiProperty({ description: 'ID da categoria', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'ID do usuário proprietário', example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @ApiProperty({ description: 'Nome da categoria', example: 'Alimentação' })
  name: string;

  @ApiProperty({ description: 'Ícone da categoria', example: 'food' })
  icon: string;

  @ApiProperty({ description: 'Tipo da categoria', enum: TransactionType, example: TransactionType.EXPENSE })
  type: TransactionType;

  @ApiPropertyOptional({ description: 'Orçamento mensal', example: 800.00 })
  budget?: number;
}

export class CategoryWithTransactionsDataDto {
  @ApiProperty({ description: 'ID da categoria', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Alimentação' })
  name: string;

  @ApiProperty({ example: 'food' })
  icon: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  type: TransactionType;

  @ApiProperty({ description: 'Quantidade de transações', example: 15 })
  transactionCount: number;

  @ApiProperty({ description: 'Total gasto', example: 650.00 })
  spending: number;

  @ApiProperty({ description: 'Orçamento definido', example: 800.00 })
  budget: number;

  @ApiProperty({ description: 'Percentual do orçamento utilizado', example: 81.25 })
  percentageUsed: number;

  @ApiProperty({ description: 'Status do orçamento', enum: ['normal', 'attention', 'critical'], example: 'attention' })
  status: string;

  @ApiProperty({ description: 'Valor restante do orçamento', example: 150.00 })
  remaining: number;
}

class CategoriesSummaryDto {
  @ApiProperty({ description: 'Total de categorias', example: 8 })
  totalCategories: number;

  @ApiProperty({ description: 'Orçamento total', example: 5000.00 })
  totalBudget: number;

  @ApiProperty({ description: 'Gasto total', example: 3200.00 })
  totalSpending: number;
}

export class CategoriesWithTransactionsResponseDto {
  @ApiProperty({ type: CategoriesSummaryDto })
  summary: CategoriesSummaryDto;

  @ApiProperty({ type: [CategoryWithTransactionsDataDto] })
  categories: CategoryWithTransactionsDataDto[];
}
