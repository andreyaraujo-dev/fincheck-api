import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportsQueryDto } from './dto/reports-query.dto';
import {
  IncomeExpensesResponseDto,
  AverageBalanceResponseDto,
  SavingsRateResponseDto,
  ExpensesByCategoryResponseDto,
} from './dto/reports-response.dto';
import { EffectiveAccountId } from '../../shared/decorators/effective-account-id';
import { EffectiveAccountGuard } from '../../shared/guards/effective-account.guard';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(EffectiveAccountGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('income-expenses')
  @ApiOperation({ summary: 'Relatório de receitas e despesas com comparação ao período anterior' })
  @ApiResponse({ status: 200, description: 'Retorna receitas/despesas do período atual, anterior e variação percentual', type: IncomeExpensesResponseDto })
  getIncomeExpenses(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Query() query: ReportsQueryDto,
  ) {
    return this.reportsService.getIncomeExpenses(
      effectiveOwnerId,
      query.startDate,
      query.endDate,
    );
  }

  @Get('average-balance')
  @ApiOperation({ summary: 'Saldo médio dos últimos 6 meses' })
  @ApiResponse({ status: 200, description: 'Retorna saldo médio e balanços mensais', type: AverageBalanceResponseDto })
  getAverageBalance(@EffectiveAccountId() effectiveOwnerId: string) {
    return this.reportsService.getAverageBalance(effectiveOwnerId);
  }

  @Get('savings-rate')
  @ApiOperation({ summary: 'Taxa de poupança do período' })
  @ApiResponse({ status: 200, description: 'Retorna receita, despesa, valor poupado, taxa e comparação com período anterior', type: SavingsRateResponseDto })
  getSavingsRate(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Query() query: ReportsQueryDto,
  ) {
    return this.reportsService.getSavingsRate(
      effectiveOwnerId,
      query.startDate,
      query.endDate,
    );
  }

  @Get('expenses-by-category')
  @ApiOperation({ summary: 'Despesas agrupadas por categoria' })
  @ApiResponse({ status: 200, description: 'Retorna total de despesas e detalhamento por categoria com percentual e contagem', type: ExpensesByCategoryResponseDto })
  getExpensesByCategory(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Query() query: ReportsQueryDto,
  ) {
    return this.reportsService.getExpensesByCategory(
      effectiveOwnerId,
      query.startDate,
      query.endDate,
    );
  }
}
