import { ApiProperty } from '@nestjs/swagger';

export class PlanResponseDto {
  @ApiProperty({ description: 'ID do plano' })
  id: string;

  @ApiProperty({ description: 'Nome do plano' })
  name: string;

  @ApiProperty({ description: 'Descrição do plano' })
  description: string;

  @ApiProperty({
    description: 'Lista de benefícios do plano',
    type: [String],
    example: ['Controle de gastos', 'Relatórios mensais', 'Metas financeiras'],
  })
  benefits: string[];

  @ApiProperty({ description: 'Preço do plano' })
  price: number;

  @ApiProperty({ description: 'Se o plano está ativo' })
  isActive: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
