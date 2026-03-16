import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
  Patch,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionsService } from './services/transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { EffectiveAccountId } from '../../shared/decorators/effective-account-id';
import { EffectiveAccountGuard } from '../../shared/guards/effective-account.guard';
import { CanDeleteGuard } from '../../shared/guards/can-delete.guard';
import { OptionalParseUuidPipe } from '../../shared/pipes/optional-parse-uuid.pipe';
import { TransactionType } from './entities/transaction';
import { OptionalParseEnumPipe } from '../../shared/pipes/optional-parse-enum.pipe';
import { OptionalParseBooleanPipe } from '../../shared/pipes/optional-parse-boolean.pipe';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(EffectiveAccountGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova transação (única ou recorrente)' })
  @ApiResponse({
    status: 201,
    description: 'Transação criada com sucesso',
    type: TransactionResponseDto,
  })
  create(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(
      effectiveOwnerId,
      createTransactionDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Listar transações do usuário por mês/ano com filtros',
  })
  @ApiQuery({
    name: 'month',
    required: true,
    description: 'Mês (1-12)',
    example: 2,
  })
  @ApiQuery({ name: 'year', required: true, description: 'Ano', example: 2026 })
  @ApiQuery({
    name: 'bankAccountId',
    required: false,
    description: 'Filtrar por conta bancária (UUID)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TransactionType,
    description: 'Filtrar por tipo',
  })
  @ApiQuery({
    name: 'isPaid',
    required: false,
    description: 'Filtrar por status de pagamento',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Buscar por título',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de transações do período',
    type: [TransactionResponseDto],
  })
  findAll(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
    @Query('bankAccountId', OptionalParseUuidPipe) bankAccountId?: string,
    @Query('type', new OptionalParseEnumPipe(TransactionType))
    type?: TransactionType,
    @Query('isPaid', OptionalParseBooleanPipe) isPaid?: boolean,
    @Query('title') title?: string,
  ) {
    return this.transactionsService.findAllByUserId(effectiveOwnerId, {
      month,
      year,
      bankAccountId,
      type,
      isPaid,
      title,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Exportar transações para planilha Excel' })
  @ApiQuery({
    name: 'month',
    required: true,
    description: 'Mês (1-12)',
    example: 2,
  })
  @ApiQuery({ name: 'year', required: true, description: 'Ano', example: 2026 })
  @ApiQuery({
    name: 'bankAccountId',
    required: false,
    description: 'Filtrar por conta bancária (UUID)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TransactionType,
    description: 'Filtrar por tipo',
  })
  @ApiQuery({
    name: 'isPaid',
    required: false,
    description: 'Filtrar por status de pagamento',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Buscar por título',
  })
  @ApiResponse({
    status: 200,
    description: 'Arquivo Excel (.xlsx)',
  })
  async export(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
    @Query('bankAccountId', OptionalParseUuidPipe) bankAccountId?: string,
    @Query('type', new OptionalParseEnumPipe(TransactionType))
    type?: TransactionType,
    @Query('isPaid', OptionalParseBooleanPipe) isPaid?: boolean,
    @Query('title') title?: string,
  ): Promise<StreamableFile> {
    const buffer = await this.transactionsService.exportToExcel(
      effectiveOwnerId,
      { month, year, bankAccountId, type, isPaid, title },
    );
    const filename = `transacoes-${month}-${year}.xlsx`;
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Get(':transactionId')
  @ApiOperation({ summary: 'Buscar uma transação por ID' })
  @ApiParam({ name: 'transactionId', description: 'ID da transação (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Dados da transação',
    type: TransactionResponseDto,
  })
  findOne(@Param('transactionId', ParseUUIDPipe) transactionId: string) {
    return this.transactionsService.findOne(transactionId);
  }

  @Put(':transactionId')
  @ApiOperation({ summary: 'Atualizar uma transação' })
  @ApiParam({ name: 'transactionId', description: 'ID da transação (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Transação atualizada com sucesso',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  update(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(
      effectiveOwnerId,
      transactionId,
      updateTransactionDto,
    );
  }

  @Put('recurring/:transactionId')
  @ApiOperation({
    summary: 'Atualizar transação recorrente (única ou futuras)',
  })
  @ApiParam({ name: 'transactionId', description: 'ID da transação (UUID)' })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['single', 'future'],
    description: 'Escopo da atualização: apenas esta ou todas futuras',
  })
  @ApiResponse({
    status: 200,
    description: 'Transação(ões) recorrente(s) atualizada(s)',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Transação não encontrada ou sem grupo de recorrência',
  })
  updateRecurring(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Query('scope') scope: 'single' | 'future' = 'single',
  ) {
    return this.transactionsService.updateRecurrenceGroup(
      effectiveOwnerId,
      transactionId,
      updateTransactionDto,
      scope,
    );
  }

  @Delete('recurring/:transactionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir transação recorrente (única ou futuras)' })
  @ApiParam({ name: 'transactionId', description: 'ID da transação (UUID)' })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['single', 'future'],
    description: 'Escopo da exclusão: apenas esta ou todas futuras',
  })
  @ApiResponse({
    status: 204,
    description: 'Transação(ões) recorrente(s) excluída(s)',
  })
  @ApiResponse({
    status: 404,
    description: 'Transação não encontrada ou sem grupo de recorrência',
  })
  @UseGuards(CanDeleteGuard)
  removeRecurring(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Query('scope') scope: 'single' | 'future' = 'single',
  ) {
    return this.transactionsService.removeRecurrenceGroup(
      effectiveOwnerId,
      transactionId,
      scope,
    );
  }

  @Patch('status/:transactionId')
  @ApiOperation({
    summary: 'Alternar status de pagamento da transação (pago/não pago)',
  })
  @ApiParam({ name: 'transactionId', description: 'ID da transação (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Status de pagamento alternado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  updateStatus(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    return this.transactionsService.updateStatus(
      effectiveOwnerId,
      transactionId,
    );
  }

  @Delete(':transactionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(CanDeleteGuard)
  @ApiOperation({ summary: 'Excluir uma transação' })
  @ApiParam({ name: 'transactionId', description: 'ID da transação (UUID)' })
  @ApiResponse({ status: 204, description: 'Transação excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  remove(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    return this.transactionsService.remove(effectiveOwnerId, transactionId);
  }
}
