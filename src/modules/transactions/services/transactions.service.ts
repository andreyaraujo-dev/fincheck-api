import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Workbook } from 'exceljs';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { TransactionsRepository } from '../../../shared/database/repositories/transactions.repository';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ValidateBankAccountOwnershipService } from '../../bank-accounts/services/validate-bank-account-ownership.service';
import { ValidateCategoryOwnershipService } from '../../categories/services/validate-category-ownership.service';
import { ValidateTransactionOwnershipService } from './validate-transaction-ownership.service';
import { TransactionType, RecurrenceFrequency } from '../entities/transaction';
import { TransactionMapper } from '../mappers/transaction.mapper';

const DEFAULT_RECURRENCE_MONTHS = 12;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly prismaService: PrismaService,
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

  async exportToExcel(
    userId: string,
    filters: {
      month: number;
      year: number;
      bankAccountId?: string;
      type?: TransactionType;
      isPaid?: boolean;
      title?: string;
    },
  ): Promise<Buffer> {
    const transactions = await this.findAllByUserId(userId, filters);

    const categoryIds = [
      ...new Set(
        transactions
          .map((t) => t.categoryId)
          .filter((id): id is string => !!id),
      ),
    ];
    const bankAccountIds = [
      ...new Set(transactions.map((t) => t.bankAccountId)),
    ];

    const [categories, bankAccounts] = await Promise.all([
      categoryIds.length > 0
        ? this.prismaService.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          })
        : [],
      this.prismaService.bankAccount.findMany({
        where: { id: { in: bankAccountIds } },
        select: { id: true, name: true },
      }),
    ]);

    const categoryMap = new Map(
      (Array.isArray(categories) ? categories : []).map((c) => [c.id, c.name]),
    );
    const bankAccountMap = new Map(
      bankAccounts.map((b) => [b.id, b.name]),
    );

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Transações', {
      headerFooter: { firstHeader: 'Transações' },
    });

    worksheet.columns = [
      { header: 'Data', key: 'date', width: 12 },
      { header: 'Título', key: 'title', width: 30 },
      { header: 'Valor', key: 'value', width: 14 },
      { header: 'Tipo', key: 'type', width: 12 },
      { header: 'Pago', key: 'isPaid', width: 8 },
      { header: 'Categoria', key: 'category', width: 20 },
      { header: 'Conta', key: 'bankAccount', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    for (const t of transactions) {
      const date = new Date(t.date);
      const dateStr = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      worksheet.addRow({
        date: dateStr,
        title: t.name,
        value: t.value,
        type: t.type === TransactionType.INCOME ? 'Receita' : 'Despesa',
        isPaid: t.isPaid ? 'Sim' : 'Não',
        category: t.categoryId ? categoryMap.get(t.categoryId) ?? '' : '',
        bankAccount: bankAccountMap.get(t.bankAccountId) ?? '',
      });
    }

    const valueCol = worksheet.getColumn('value');
    valueCol.numFmt = '"R$ "#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  findOne(transactionId: string) {
    return `This action returns a #${transactionId} transaction`;
  }

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const {
      name,
      type,
      bankAccountId,
      date,
      value,
      categoryId,
      isPaid,
      recurrenceFrequency,
      recurrenceEndDate,
    } = createTransactionDto;

    await this.validateEntitiesOwnership({ categoryId, userId, bankAccountId });

    if (recurrenceFrequency) {
      return this.createRecurringTransactions({
        userId,
        bankAccountId,
        categoryId,
        name,
        type,
        date,
        value,
        isPaid,
        recurrenceFrequency,
        recurrenceEndDate,
      });
    }

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

  async updateRecurrenceGroup(
    userId: string,
    transactionId: string,
    updateTransactionDto: UpdateTransactionDto,
    scope: 'single' | 'future',
  ) {
    await this.validateEntitiesOwnership({ userId, transactionId });

    if (updateTransactionDto.bankAccountId) {
      await this.validateEntitiesOwnership({
        userId,
        bankAccountId: updateTransactionDto.bankAccountId,
      });
    }

    if (updateTransactionDto.categoryId) {
      await this.validateEntitiesOwnership({
        userId,
        categoryId: updateTransactionDto.categoryId,
      });
    }

    const transaction = await this.transactionsRepository.findFirst({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (scope === 'single') {
      const { name, type, value, bankAccountId, categoryId, isPaid } =
        updateTransactionDto;

      return this.transactionsRepository.update({
        where: { id: transactionId },
        data: {
          name,
          type,
          value,
          bankAccountId,
          categoryId,
          isPaid,
        },
      });
    }

    // scope === 'future': atualizar esta e todas as futuras do grupo
    if (!transaction.recurrenceGroupId) {
      throw new NotFoundException(
        'Transaction does not belong to a recurrence group',
      );
    }

    const { name, type, value, bankAccountId, categoryId, isPaid } =
      updateTransactionDto;

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (value !== undefined) data.value = value;
    if (bankAccountId !== undefined) data.bankAccountId = bankAccountId;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (isPaid !== undefined) data.isPaid = isPaid;

    return this.transactionsRepository.updateManyByGroupId(
      transaction.recurrenceGroupId,
      transaction.date,
      data,
    );
  }

  async removeRecurrenceGroup(
    userId: string,
    transactionId: string,
    scope: 'single' | 'future',
  ) {
    await this.validateEntitiesOwnership({ userId, transactionId });

    const transaction = await this.transactionsRepository.findFirst({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (scope === 'single') {
      return this.transactionsRepository.delete({
        where: { id: transactionId },
      });
    }

    // scope === 'future': deletar esta e todas as futuras do grupo
    if (!transaction.recurrenceGroupId) {
      throw new NotFoundException(
        'Transaction does not belong to a recurrence group',
      );
    }

    return this.transactionsRepository.deleteManyByGroupId(
      transaction.recurrenceGroupId,
      transaction.date,
    );
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

  private async createRecurringTransactions(params: {
    userId: string;
    bankAccountId: string;
    categoryId?: string;
    name: string;
    type: TransactionType;
    date: string;
    value: number;
    isPaid?: boolean;
    recurrenceFrequency: RecurrenceFrequency;
    recurrenceEndDate?: string;
  }) {
    const {
      userId,
      bankAccountId,
      categoryId,
      name,
      type,
      date,
      value,
      isPaid,
      recurrenceFrequency,
      recurrenceEndDate,
    } = params;

    const recurrenceGroupId = randomUUID();
    const startDate = new Date(date);

    const maxEndDate = new Date(startDate);
    maxEndDate.setMonth(maxEndDate.getMonth() + DEFAULT_RECURRENCE_MONTHS);

    const parsedEndDate = recurrenceEndDate
      ? new Date(recurrenceEndDate)
      : null;

    // Se recurrenceEndDate foi informado, ajustar para o fim do dia para incluir o último mês
    if (parsedEndDate) {
      parsedEndDate.setHours(23, 59, 59, 999);
    }

    const endDate = parsedEndDate
      ? new Date(Math.min(parsedEndDate.getTime(), maxEndDate.getTime()))
      : maxEndDate;

    const dates = this.generateRecurrenceDates(
      startDate,
      recurrenceFrequency,
      endDate,
    );

    const transactionsData = dates.map((d, index) => ({
      userId,
      bankAccountId,
      categoryId,
      name,
      type,
      date: d,
      value,
      // Apenas a primeira transação (mês atual) respeita o isPaid enviado;
      // todas as futuras são criadas como não pagas
      isPaid: index === 0 ? (isPaid ?? false) : false,
      recurrenceFrequency,
      recurrenceEndDate: parsedEndDate,
      recurrenceGroupId,
    }));

    await this.transactionsRepository.createMany({
      data: transactionsData,
    });

    // Retornar a primeira transação criada
    return this.transactionsRepository.findFirst({
      where: { recurrenceGroupId },
      orderBy: { date: 'asc' },
    });
  }

  private generateRecurrenceDates(
    startDate: Date,
    frequency: RecurrenceFrequency,
    endDate: Date,
  ): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      dates.push(new Date(current));

      switch (frequency) {
        case RecurrenceFrequency.DAILY:
          current.setDate(current.getDate() + 1);
          break;
        case RecurrenceFrequency.WEEKLY:
          current.setDate(current.getDate() + 7);
          break;
        case RecurrenceFrequency.MONTHLY:
          current.setMonth(current.getMonth() + 1);
          break;
        case RecurrenceFrequency.YEARLY:
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
    }

    return dates;
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
