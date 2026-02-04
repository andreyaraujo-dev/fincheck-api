import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateSubscriptionDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  value: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  billingIntervalMonths?: number = 1;
}
