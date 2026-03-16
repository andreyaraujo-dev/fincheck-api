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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BankAccountsService } from './services/bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BankAccountResponseDto, BankAccountWithBalanceResponseDto } from './dto/bank-account-response.dto';
import { EffectiveAccountId } from '../../shared/decorators/effective-account-id';
import { EffectiveAccountGuard } from '../../shared/guards/effective-account.guard';
import { CanDeleteGuard } from '../../shared/guards/can-delete.guard';

@ApiTags('Bank Accounts')
@ApiBearerAuth()
@Controller('bank-accounts')
@UseGuards(EffectiveAccountGuard)
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova conta bancária' })
  @ApiResponse({ status: 201, description: 'Conta criada com sucesso', type: BankAccountResponseDto })
  create(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Body() createBankAccountDto: CreateBankAccountDto,
  ) {
    return this.bankAccountsService.create(effectiveOwnerId, createBankAccountDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as contas bancárias do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de contas com saldo atual', type: [BankAccountWithBalanceResponseDto] })
  findAll(@EffectiveAccountId() effectiveOwnerId: string) {
    return this.bankAccountsService.findAllByUserId(effectiveOwnerId);
  }

  @Get(':bankAccountId')
  @ApiOperation({ summary: 'Buscar uma conta bancária por ID' })
  @ApiParam({ name: 'bankAccountId', description: 'ID da conta bancária (UUID)' })
  @ApiResponse({ status: 200, description: 'Dados da conta bancária', type: BankAccountResponseDto })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  findOne(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Param('bankAccountId', ParseUUIDPipe) bankAccountId: string,
  ) {
    return this.bankAccountsService.findOneByUserId(effectiveOwnerId, bankAccountId);
  }

  @Put(':bankAccountId')
  @ApiOperation({ summary: 'Atualizar uma conta bancária' })
  @ApiParam({ name: 'bankAccountId', description: 'ID da conta bancária (UUID)' })
  @ApiResponse({ status: 200, description: 'Conta atualizada com sucesso', type: BankAccountResponseDto })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  update(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Param('bankAccountId', ParseUUIDPipe) bankAccountId: string,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
  ) {
    return this.bankAccountsService.update(
      effectiveOwnerId,
      bankAccountId,
      updateBankAccountDto,
    );
  }

  @Delete(':bankAccountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(CanDeleteGuard)
  @ApiOperation({ summary: 'Excluir uma conta bancária' })
  @ApiParam({ name: 'bankAccountId', description: 'ID da conta bancária (UUID)' })
  @ApiResponse({ status: 204, description: 'Conta excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  remove(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Param('bankAccountId', ParseUUIDPipe) bankAccountId: string,
  ) {
    return this.bankAccountsService.remove(effectiveOwnerId, bankAccountId);
  }
}
