import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  Min,
} from 'class-validator';
import { TransactionType } from '../entities/transaction';

export class SimulateQueryDto {
  @ApiPropertyOptional({
    description: 'Meses da projeção (12, 24 ou 60)',
    default: 12,
    enum: [12, 24, 60],
  })
  @IsOptional()
  @IsNumber()
  @IsIn([12, 24, 60])
  period?: number = 12;

  @ApiProperty({ description: 'Tipo da simulação', enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Valor (mensal para INCOME, parcela para EXPENSE)',
    example: 500,
  })
  @IsNumber()
  @IsPositive()
  value: number;

  @ApiProperty({
    description: 'Data de início do efeito (ISO 8601)',
    example: '2026-04-01',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Conta afetada (default: primeira conta)',
  })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({
    description: 'Categoria (para orçamento)',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Número de parcelas (para compra de bem ou quitação manual)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  parcels?: number;

  @ApiPropertyOptional({
    description: 'Valor da entrada (para compra de bem)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  entrada?: number;

  @ApiPropertyOptional({
    description: 'Taxa de juros mensal em % (para PMT na compra de bem)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  juros?: number;

  @ApiPropertyOptional({
    description:
      'Para quitação: ID do grupo de recorrência a excluir da projeção',
  })
  @IsOptional()
  @IsUUID()
  recurrenceGroupId?: string;
}
