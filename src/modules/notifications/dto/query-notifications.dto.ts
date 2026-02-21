import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryNotificationsDto {
  @ApiPropertyOptional({ description: 'Número da página', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number;

  @ApiPropertyOptional({ description: 'Filtrar apenas não lidas', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  unreadOnly?: boolean;
}
