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
import { TransactionsService } from './services/transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ActiveUserId } from '../../shared/decorators/active-user-id';
import { OptionalParseUuidPipe } from '../../shared/pipes/optional-parse-uuid.pipe';
import { TransactionType } from './entities/transaction';
import { OptionalParseEnumPipe } from '../../shared/pipes/optional-parse-enum.pipe';
import { OptionalParseBooleanPipe } from '../../shared/pipes/optional-parse-boolean.pipe';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @ActiveUserId() userId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(userId, createTransactionDto);
  }

  @Get()
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
  findOne(@Param('transactionId', ParseUUIDPipe) transactionId: string) {
    return this.transactionsService.findOne(transactionId);
  }

  @Put(':transactionId')
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
  updateStatus(
    @ActiveUserId() userId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    return this.transactionsService.updateStatus(userId, transactionId);
  }

  @Delete(':transactionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @ActiveUserId() userId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    return this.transactionsService.remove(userId, transactionId);
  }
}
