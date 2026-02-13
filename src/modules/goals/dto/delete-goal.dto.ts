import { IsBoolean, IsOptional } from 'class-validator';

export class DeleteGoalDto {
  @IsOptional()
  @IsBoolean()
  deleteTransactions?: boolean = false;
}
