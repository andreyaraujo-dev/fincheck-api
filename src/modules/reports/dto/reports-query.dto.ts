import {
  IsDateString,
  IsOptional,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isEndDateAfterStartDate', async: false })
export class IsEndDateAfterStartDate implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const obj = args.object as ReportsQueryDto;
    if (!obj.startDate || !endDate) return true;
    return new Date(endDate) >= new Date(obj.startDate);
  }

  defaultMessage() {
    return 'endDate deve ser maior ou igual a startDate';
  }
}

@ValidatorConstraint({ name: 'isMaxDateRange', async: false })
export class IsMaxDateRange implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const obj = args.object as ReportsQueryDto;
    if (!obj.startDate || !endDate) return true;
    const start = new Date(obj.startDate);
    const end = new Date(endDate);
    const diffInDays = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffInDays <= 90;
  }

  defaultMessage() {
    return 'O intervalo entre startDate e endDate não pode ultrapassar 90 dias';
  }
}

export class ReportsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @Validate(IsEndDateAfterStartDate)
  @Validate(IsMaxDateRange)
  endDate?: string;
}
