import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TransactionType } from 'src/modules/transactions/entities/transaction';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nome da categoria', example: 'Alimentação' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Ícone da categoria', example: 'food' })
  @IsString()
  @IsNotEmpty()
  icon: string;

  @ApiProperty({ description: 'Tipo da categoria', enum: TransactionType, example: TransactionType.EXPENSE })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @ApiPropertyOptional({ description: 'Orçamento mensal da categoria', example: 800.00 })
  @IsNumber()
  @IsOptional()
  budget?: number;
}
