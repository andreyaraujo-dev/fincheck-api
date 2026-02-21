import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { BankAccountType } from '../entities/bank-account';

export class CreateBankAccountDto {
  @ApiProperty({ description: 'Nome da conta bancária', example: 'Nubank' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Saldo inicial da conta', example: 1500.00 })
  @IsNumber()
  @IsNotEmpty()
  initialBalance: number;

  @ApiProperty({ description: 'Tipo da conta bancária', enum: BankAccountType, example: BankAccountType.CHECKING })
  @IsNotEmpty()
  @IsEnum(BankAccountType)
  type: BankAccountType;

  @ApiProperty({ description: 'Cor da conta em hexadecimal', example: '#7950F2' })
  @IsString()
  @IsNotEmpty()
  @IsHexColor()
  color: string;
}
