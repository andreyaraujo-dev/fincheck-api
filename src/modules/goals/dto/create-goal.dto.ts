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
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  targetValue: number;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(GoalStatus)
  status: GoalStatus;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(GoalImportance)
  importance: GoalImportance;

  @IsString()
  @IsNotEmpty()
  @IsEnum(GoalPriority)
  priority: GoalPriority;
}
