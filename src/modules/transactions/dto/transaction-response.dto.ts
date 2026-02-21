import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, RecurrenceFrequency } from '../entities/transaction';

export class TransactionResponseDto {
  @ApiProperty({ description: 'ID da transação', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  bankAccountId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003' })
  categoryId?: string;

  @ApiProperty({ description: 'Nome/título da transação', example: 'Salário mensal' })
  name: string;

  @ApiProperty({ description: 'Valor da transação', example: 5000.00 })
  value: number;

  @ApiProperty({ description: 'Data da transação', example: '2026-02-20T00:00:00.000Z' })
  date: string;

  @ApiProperty({ description: 'Tipo da transação', enum: TransactionType, example: TransactionType.INCOME })
  type: TransactionType;

  @ApiPropertyOptional({ description: 'Se já foi paga/recebida', example: true })
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'Frequência de recorrência', enum: RecurrenceFrequency, example: null })
  recurrenceFrequency?: RecurrenceFrequency;

  @ApiPropertyOptional({ description: 'Data final da recorrência', example: null })
  recurrenceEndDate?: string;

  @ApiPropertyOptional({ description: 'ID do grupo de recorrência', example: null })
  recurrenceGroupId?: string;
}
