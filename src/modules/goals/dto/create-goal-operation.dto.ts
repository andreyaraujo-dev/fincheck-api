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
  @IsString()
  @IsNotEmpty()
  @IsEnum(GoalOperationType)
  type: GoalOperationType;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  value: number;

  @IsString()
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
