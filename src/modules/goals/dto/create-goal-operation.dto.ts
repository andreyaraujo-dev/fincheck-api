import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { GoalOperationType } from '../entities/goal-operation.entity';

export class CreateGoalOperationDto {
  @ApiProperty({ description: 'Tipo da operação', enum: GoalOperationType, example: GoalOperationType.DEPOSIT })
  @IsString()
  @IsNotEmpty()
  @IsEnum(GoalOperationType)
  type: GoalOperationType;

  @ApiProperty({ description: 'Valor da operação', example: 500.00 })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  value: number;

  @ApiPropertyOptional({ description: 'ID da conta bancária associada (obrigatório para DEPOSIT e WITHDRAW)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ description: 'Descrição da operação', example: 'Depósito mensal' })
  @IsString()
  @IsOptional()
  description?: string;
}
