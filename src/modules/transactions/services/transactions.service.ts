import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { TransactionsRepository } from '../../../shared/database/repositories/transactions.repository';
import { ValidateBankAccountOwnershipService } from '../../bank-accounts/services/validate-bank-account-ownership.service';
import { ValidateCategoryOwnershipService } from '../../categories/services/validate-category-ownership.service';
import { ValidateTransactionOwnershipService } from './validate-transaction-ownership.service';
import { TransactionType } from '../entities/transaction';
import { TransactionMapper } from '../mappers/transaction.mapper';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly validateBankAccountOwnershipService: ValidateBankAccountOwnershipService,
    private readonly validateCategoryOwnershipService: ValidateCategoryOwnershipService,
    private readonly validateTransactionOwnershipService: ValidateTransactionOwnershipService,
  ) {}

  async findAllByUserId(
    userId: string,
    filters: {
      month: number;
      year: number;
      bankAccountId?: string;
      type?: TransactionType;
      isPaid?: boolean;
      title?: string;
    },
  ) {
    const transactions =
      await this.transactionsRepository.findManyWithNormalizedSearch({
        userId,
        month: filters.month,
        year: filters.year,
        bankAccountId: filters.bankAccountId,
        type: filters.type,
        isPaid: filters.isPaid,
        title: filters.title,
      });

    return TransactionMapper.toDomainMany(transactions as any[]);
  }

  findOne(transactionId: string) {
    return `This action returns a #${transactionId} transaction`;
  }

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const { name, type, bankAccountId, date, value, categoryId, isPaid } =
      createTransactionDto;

    await this.validateEntitiesOwnership({ categoryId, userId, bankAccountId });

    return this.transactionsRepository.create({
      data: {
        userId,
        bankAccountId,
        categoryId,
        name,
        type,
        date,
        value,
        isPaid,
      },
    });
  }

  async update(
    userId: string,
    transactionId: string,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const { name, type, date, value, bankAccountId, categoryId, isPaid } =
      updateTransactionDto;

    await this.validateEntitiesOwnership({
      categoryId,
      userId,
      bankAccountId,
      transactionId,
    });

    return this.transactionsRepository.update({
      where: { id: transactionId },
      data: {
        name,
        type,
        date,
        value,
        bankAccountId,
        categoryId,
        isPaid,
      },
    });
  }

  async updateStatus(userId: string, transactionId: string) {
    await this.validateEntitiesOwnership({ userId, transactionId });

    const transaction = await this.transactionsRepository.findFirst({
      where: { id: transactionId },
    });

    await this.transactionsRepository.update({
      where: { id: transactionId },
      data: { isPaid: !transaction.isPaid },
    });
  }

  async remove(userId: string, transactionId: string) {
    await this.validateEntitiesOwnership({ userId, transactionId });

    await this.transactionsRepository.delete({
      where: { id: transactionId },
    });
  }

  private async validateEntitiesOwnership({
    userId,
    bankAccountId,
    categoryId,
    transactionId,
  }: {
    userId: string;
    categoryId?: string;
    bankAccountId?: string;
    transactionId?: string;
  }) {
    await Promise.all([
      transactionId &&
        this.validateTransactionOwnershipService.validate(
          userId,
          transactionId,
        ),
      bankAccountId &&
        this.validateBankAccountOwnershipService.validate(
          userId,
          bankAccountId,
        ),
      categoryId &&
        this.validateCategoryOwnershipService.validate(userId, categoryId),
    ]);
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, '') // Remove caracteres especiais
      .trim();
  }

  private createSearchRegex(searchText: string): string {
    const normalized = this.normalizeText(searchText);
    // Escapa caracteres especiais do regex
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Cria um padrão que ignora acentos e case
    return `.*${escaped}.*`;
  }
}
