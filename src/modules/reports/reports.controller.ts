import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsQueryDto } from './dto/reports-query.dto';
import { ActiveUserId } from '../../shared/decorators/active-user-id';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Busca os dados de receitas e despesas do usuário
   * @param userId - The ID of the user
   * @param query - The query parameters (startDate, endDate)
   * @returns - The income expenses report
   */
  @Get('income-expenses')
  getIncomeExpenses(
    @ActiveUserId() userId: string,
    @Query() query: ReportsQueryDto,
  ) {
    return this.reportsService.getIncomeExpenses(
      userId,
      query.startDate,
      query.endDate,
    );
  }

  /**
   * Busca o saldo médio do usuário
   * @param userId - The ID of the user
   * @returns - The average balance
   */
  @Get('average-balance')
  getAverageBalance(@ActiveUserId() userId: string) {
    return this.reportsService.getAverageBalance(userId);
  }

  /**
   * Busca a taxa de poupança do usuário
   * @param userId - The ID of the user
   * @param query - The query parameters (startDate, endDate)
   * @returns - The savings rate
   */
  @Get('savings-rate')
  getSavingsRate(
    @ActiveUserId() userId: string,
    @Query() query: ReportsQueryDto,
  ) {
    return this.reportsService.getSavingsRate(
      userId,
      query.startDate,
      query.endDate,
    );
  }

  /**
   * Busca as despesas agrupadas por categoria
   * @param userId - The ID of the user
   * @param query - The query parameters (startDate, endDate)
   * @returns - The expenses by category
   */
  @Get('expenses-by-category')
  getExpensesByCategory(
    @ActiveUserId() userId: string,
    @Query() query: ReportsQueryDto,
  ) {
    return this.reportsService.getExpensesByCategory(
      userId,
      query.startDate,
      query.endDate,
    );
  }
}
