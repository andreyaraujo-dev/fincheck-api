import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ description: 'Nome do plano', example: 'Basic' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Descrição do plano', example: 'Plano básico com funcionalidades essenciais' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Lista de benefícios do plano',
    type: [String],
    example: ['Controle de gastos', 'Relatórios mensais'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[];

  @ApiProperty({ description: 'Preço do plano', example: 9.99 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional({ description: 'Se o plano está ativo', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
