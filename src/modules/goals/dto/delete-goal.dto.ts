import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class DeleteGoalDto {
  @ApiPropertyOptional({ description: 'Se true, exclui também as transações vinculadas à meta', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  deleteTransactions?: boolean = false;
}
