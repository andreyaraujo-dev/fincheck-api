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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionsService } from './services/transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { ActiveUserId } from '../../shared/decorators/active-user-id';
import { OptionalParseUuidPipe } from '../../shared/pipes/optional-parse-uuid.pipe';
import { TransactionType } from './entities/transaction';
import { OptionalParseEnumPipe } from '../../shared/pipes/optional-parse-enum.pipe';
import { OptionalParseBooleanPipe } from '../../shared/pipes/optional-parse-boolean.pipe';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova transação (única ou recorrente)' })
  @ApiResponse({ status: 201, description: 'Transação criada com sucesso', type: TransactionResponseDto })
  create(
    @ActiveUserId() userId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(userId, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar transações do usuário por mês/ano com filtros' })
  @ApiQuery({ name: 'month', required: true, description: 'Mês (1-12)', example: 2 })
  @ApiQuery({ name: 'year', required: true, description: 'Ano', example: 2026 })
  @ApiQuery({ name: 'bankAccountId', required: false, description: 'Filtrar por conta bancária (UUID)' })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType, description: 'Filtrar por tipo' })
  @ApiQuery({ name: 'isPaid', required: false, description: 'Filtrar por status de pagamento' })
  @ApiQuery({ name: 'title', required: false, description: 'Buscar por título' })
  @ApiResponse({ status: 200, description: 'Lista de transações do período', type: [TransactionResponseDto] })
  findAll(
    @ActiveUserId() userId: string,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
    @Query('bankAccountId', OptionalParseUuidPipe) bankAccountId?: string,
    @Query('type', new OptionalParseEnumPipe(TransactionType))
    type?: TransactionType,
    @Query('isPaid', OptionalParseBooleanPipe) isPaid?: boolean,
    @Query('title') title?: string,
  ) {
    return this.transactionsService.findAllByUserId(userId, {
      month,
      year,
      bankAccountId,
      type,
      isPaid,
      title,
    });
  }

  @Get(':transactionId')
  @ApiOperation({ summary: 'Buscar uma transação por ID' })
  @ApiParam({ name: 'transactionId', description: 'ID da transação (UUID)' })
  @ApiResponse({ status: 200, description: 'Dados da transação', type: TransactionResponseDto })
  findOne(@Param('transactionId', ParseUUIDPipe) transactionId: string) {
    return this.transactionsService.findOne(transactionId);
  }

  @Put(':transactionId')
  @ApiOperation({ summary: 'Atualizar uma transação' })
  @ApiParam({ name: 'transactionId', description: 'ID da transação (UUID)' })
  @ApiResponse({ status: 200, description: 'Transação atualizada com sucesso', type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  update(
    @ActiveUserId() userId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(
      userId,
      transactionId,
      updateTransactionDto,
    );
  }

  @Put('recurring/:transactionId')
  @ApiOperation({ summary: 'Atualizar transação recorrente (única ou futuras)' })
  @ApiParam({ name: 'transactionId', description: 'ID da transação (UUID)' })
  @ApiQuery({ name: 'scope', required: false, enum: ['single', 'future'], description: 'Escopo da atualização: apenas esta ou todas futuras' })
  @ApiResponse({ status: 200, description: 'Transação(ões) recorrente(s) atualizada(s)', type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'Transação não encontrada ou sem grupo de recorrência' })
  updateRecurring(
    @ActiveUserId() userId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Query('scope') scope: 'single' | 'future' = 'single',
  ) {
    return this.transactionsService.updateRecurrenceGroup(
      userId,
      transactionId,
      updateTransactionDto,
      scope,
    );
  }

  @Delete('recurring/:transactionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir transação recorrente (única ou futuras)' })
  @ApiParam({ name: 'transactionId', description: 'ID da transação (UUID)' })
  @ApiQuery({ name: 'scope', required: false, enum: ['single', 'future'], description: 'Escopo da exclusão: apenas esta ou todas futuras' })
  @ApiResponse({ status: 204, description: 'Transação(ões) recorrente(s) excluída(s)' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada ou sem grupo de recorrência' })
  removeRecurring(
    @ActiveUserId() userId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Query('scope') scope: 'single' | 'future' = 'single',
  ) {
    return this.transactionsService.removeRecurrenceGroup(
      userId,
      transactionId,
      scope,
    );
  }

  @Patch('status/:transactionId')
  @ApiOperation({ summary: 'Alternar status de pagamento da transação (pago/não pago)' })
  @ApiParam({ name: 'transactionId', description: 'ID da transação (UUID)' })
  @ApiResponse({ status: 200, description: 'Status de pagamento alternado com sucesso' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  updateStatus(
    @ActiveUserId() userId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    return this.transactionsService.updateStatus(userId, transactionId);
  }

  @Delete(':transactionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir uma transação' })
  @ApiParam({ name: 'transactionId', description: 'ID da transação (UUID)' })
  @ApiResponse({ status: 204, description: 'Transação excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  remove(
    @ActiveUserId() userId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    return this.transactionsService.remove(userId, transactionId);
  }
}
