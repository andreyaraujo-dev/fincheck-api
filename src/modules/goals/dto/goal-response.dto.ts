import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  GoalStatus,
  GoalImportance,
  GoalPriority,
} from '../entities/goal.entity';
import { GoalOperationType } from '../entities/goal-operation.entity';
import { TransactionType } from 'src/modules/transactions/entities/transaction';

class GoalCategoryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Viagens' })
  name: string;

  @ApiProperty({ example: 'travel' })
  icon: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  type: TransactionType;
}

export class GoalResponseDto {
  @ApiProperty({
    description: 'ID da meta',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  categoryId: string;

  @ApiProperty({ description: 'Nome da meta', example: 'Viagem para Europa' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição da meta',
    example: 'Juntar dinheiro para viagem em julho',
  })
  description?: string;

  @ApiProperty({ description: 'Valor alvo', example: 15000.0 })
  targetValue: number;

  @ApiProperty({ description: 'Valor atual acumulado', example: 5200.0 })
  currentValue: number;

  @ApiProperty({
    description: 'Data limite',
    example: '2026-12-31T00:00:00.000Z',
  })
  dueDate: string;

  @ApiProperty({ enum: GoalStatus, example: GoalStatus.IN_PROGRESS })
  status: GoalStatus;

  @ApiProperty({ enum: GoalImportance, example: GoalImportance.HIGH })
  importance: GoalImportance;

  @ApiProperty({ enum: GoalPriority, example: GoalPriority.HIGH })
  priority: GoalPriority;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-02-20T14:00:00.000Z' })
  updatedAt: string;

  @ApiPropertyOptional({ type: GoalCategoryDto })
  category?: GoalCategoryDto;
}

class OperationBankAccountDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Nubank' })
  name: string;
}

export class GoalOperationResponseDto {
  @ApiProperty({
    description: 'ID da operação',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  goalId: string;

  @ApiProperty({
    description: 'Tipo da operação',
    enum: GoalOperationType,
    example: GoalOperationType.DEPOSIT,
  })
  type: GoalOperationType;

  @ApiProperty({ description: 'Valor da operação', example: 500.0 })
  value: number;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002' })
  bankAccountId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003' })
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Descrição da operação',
    example: 'Depósito mensal',
  })
  description?: string;

  @ApiProperty({ example: '2026-02-20T14:00:00.000Z' })
  createdAt: string;

  @ApiPropertyOptional({ type: OperationBankAccountDto })
  bankAccount?: OperationBankAccountDto;
}
