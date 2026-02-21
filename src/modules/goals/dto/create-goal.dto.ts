import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  GoalStatus,
  GoalImportance,
  GoalPriority,
} from '../entities/goal.entity';

export class CreateGoalDto {
  @ApiProperty({ description: 'Nome da meta', example: 'Viagem para Europa' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição da meta', example: 'Juntar dinheiro para viagem em julho' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Valor alvo da meta', example: 15000.00 })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  targetValue: number;

  @ApiProperty({ description: 'Data limite da meta (ISO 8601)', example: '2026-12-31' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ description: 'Status da meta', enum: GoalStatus, example: GoalStatus.IN_PROGRESS })
  @IsString()
  @IsNotEmpty()
  @IsEnum(GoalStatus)
  status: GoalStatus;

  @ApiProperty({ description: 'ID da categoria associada', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: 'Importância da meta', enum: GoalImportance, example: GoalImportance.HIGH })
  @IsString()
  @IsNotEmpty()
  @IsEnum(GoalImportance)
  importance: GoalImportance;

  @ApiProperty({ description: 'Prioridade da meta', enum: GoalPriority, example: GoalPriority.HIGH })
  @IsString()
  @IsNotEmpty()
  @IsEnum(GoalPriority)
  priority: GoalPriority;
}
