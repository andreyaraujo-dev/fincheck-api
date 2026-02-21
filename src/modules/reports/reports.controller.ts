import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportsQueryDto } from './dto/reports-query.dto';
import {
  IncomeExpensesResponseDto,
  AverageBalanceResponseDto,
  SavingsRateResponseDto,
  ExpensesByCategoryResponseDto,
} from './dto/reports-response.dto';
import { ActiveUserId } from '../../shared/decorators/active-user-id';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('income-expenses')
  @ApiOperation({ summary: 'Relatório de receitas e despesas com comparação ao período anterior' })
  @ApiResponse({ status: 200, description: 'Retorna receitas/despesas do período atual, anterior e variação percentual', type: IncomeExpensesResponseDto })
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

  @Get('average-balance')
  @ApiOperation({ summary: 'Saldo médio dos últimos 6 meses' })
  @ApiResponse({ status: 200, description: 'Retorna saldo médio e balanços mensais', type: AverageBalanceResponseDto })
  getAverageBalance(@ActiveUserId() userId: string) {
    return this.reportsService.getAverageBalance(userId);
  }

  @Get('savings-rate')
  @ApiOperation({ summary: 'Taxa de poupança do período' })
  @ApiResponse({ status: 200, description: 'Retorna receita, despesa, valor poupado, taxa e comparação com período anterior', type: SavingsRateResponseDto })
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

  @Get('expenses-by-category')
  @ApiOperation({ summary: 'Despesas agrupadas por categoria' })
  @ApiResponse({ status: 200, description: 'Retorna total de despesas e detalhamento por categoria com percentual e contagem', type: ExpensesByCategoryResponseDto })
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
