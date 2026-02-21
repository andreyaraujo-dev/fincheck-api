import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BankAccountType } from '../entities/bank-account';

export class BankAccountResponseDto {
  @ApiProperty({ description: 'ID da conta bancária', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'ID do usuário proprietário', example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @ApiProperty({ description: 'Nome da conta', example: 'Nubank' })
  name: string;

  @ApiProperty({ description: 'Saldo inicial', example: 1500.00 })
  initialBalance: number;

  @ApiProperty({ description: 'Cor em hexadecimal', example: '#7950F2' })
  color: string;

  @ApiProperty({ description: 'Tipo da conta', enum: BankAccountType, example: BankAccountType.CHECKING })
  type: BankAccountType;
}

export class BankAccountWithBalanceResponseDto extends BankAccountResponseDto {
  @ApiProperty({ description: 'Saldo atual calculado', example: 3250.75 })
  currentBalance: number;
}
