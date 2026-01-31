import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ReportsQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  month?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;
}
