import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
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
  TransactionType,
  RecurrenceFrequency,
} from '../entities/transaction';

export class CreateTransactionDto {
  @ApiProperty({ description: 'ID da conta bancária', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  bankAccountId: string;

  @ApiPropertyOptional({ description: 'ID da categoria', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsString()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: 'Nome/título da transação', example: 'Salário mensal' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Valor da transação', example: 5000.00 })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  value: number;

  @ApiProperty({ description: 'Data da transação (ISO 8601)', example: '2026-02-20' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Tipo da transação', enum: TransactionType, example: TransactionType.INCOME })
  @IsString()
  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({ description: 'Se a transação já foi paga/recebida', example: true })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'Frequência de recorrência', enum: RecurrenceFrequency, example: RecurrenceFrequency.MONTHLY })
  @IsOptional()
  @IsEnum(RecurrenceFrequency)
  recurrenceFrequency?: RecurrenceFrequency;

  @ApiPropertyOptional({ description: 'Data final da recorrência (ISO 8601)', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  recurrenceEndDate?: string;
}
