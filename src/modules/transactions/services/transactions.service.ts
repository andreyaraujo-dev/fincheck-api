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
    const bankAccountMap = new Map(bankAccounts.map((b) => [b.id, b.name]));

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
        category: t.categoryId ? (categoryMap.get(t.categoryId) ?? '') : '',
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

    const {
      name,
      type,
      value,
      bankAccountId,
      categoryId,
      isPaid,
      date,
      recurrenceEndDate: newEndDateStr,
      recurrenceFrequency: newFrequency,
    } = updateTransactionDto;

    const needsGroupId =
      scope === 'future' ||
      newEndDateStr !== undefined ||
      newFrequency !== undefined;

    if (needsGroupId && !transaction.recurrenceGroupId) {
      throw new NotFoundException(
        'Transaction does not belong to a recurrence group',
      );
    }

    const groupId = transaction.recurrenceGroupId!;
    const frequencyChanged =
      newFrequency !== undefined &&
      newFrequency !== transaction.recurrenceFrequency;

    await this.prismaService.$transaction(async (tx) => {
      // Normalizar novo término (fim do dia, inclusive)
      let parsedNewEndDate: Date | null = null;
      if (newEndDateStr !== undefined) {
        parsedNewEndDate = new Date(newEndDateStr);
        parsedNewEndDate.setHours(23, 59, 59, 999);
      }

      // ---------------------------------------------------------------
      // Frequência mudou → substituir a grade inteira de ocorrências
      // ---------------------------------------------------------------
      if (frequencyChanged) {
        const allTx = await tx.transaction.findMany({
          where: { recurrenceGroupId: groupId },
          orderBy: { date: 'asc' },
        });

        const startDate = new Date(allTx[0].date);

        let effectiveEnd: Date;
        if (parsedNewEndDate) {
          effectiveEnd = parsedNewEndDate;
        } else if (transaction.recurrenceEndDate) {
          effectiveEnd = new Date(transaction.recurrenceEndDate);
        } else {
          effectiveEnd = new Date(startDate);
          effectiveEnd.setMonth(
            effectiveEnd.getMonth() + DEFAULT_RECURRENCE_MONTHS,
          );
        }

        const maxEnd = new Date(startDate);
        maxEnd.setMonth(maxEnd.getMonth() + DEFAULT_RECURRENCE_MONTHS);
        const cappedEnd = new Date(
          Math.min(effectiveEnd.getTime(), maxEnd.getTime()),
        );

        const newDates = this.generateRecurrenceDates(
          startDate,
          newFrequency!,
          cappedEnd,
        );

        const newEndDateForGroup =
          parsedNewEndDate ?? transaction.recurrenceEndDate ?? null;

        const commonOverride = {
          recurrenceFrequency: newFrequency!,
          recurrenceEndDate: newEndDateForGroup,
          ...(name !== undefined && { name }),
          ...(type !== undefined && { type }),
          ...(value !== undefined && { value }),
          ...(bankAccountId !== undefined && { bankAccountId }),
          ...(categoryId !== undefined && { categoryId }),
        };

        // Atualizar existentes por posição (preserva isPaid)
        for (let i = 0; i < Math.min(newDates.length, allTx.length); i++) {
          await tx.transaction.update({
            where: { id: allTx[i].id },
            data: { date: newDates[i], ...commonOverride },
          });
        }

        // Criar novas ocorrências se a nova grade for maior
        const template = allTx[0];
        for (let i = allTx.length; i < newDates.length; i++) {
          await tx.transaction.create({
            data: {
              userId: template.userId,
              bankAccountId: bankAccountId ?? template.bankAccountId,
              categoryId: categoryId ?? template.categoryId ?? undefined,
              name: name ?? template.name,
              type: type ?? template.type,
              value: value ?? template.value,
              date: newDates[i],
              isPaid: false,
              recurrenceFrequency: newFrequency!,
              recurrenceEndDate: newEndDateForGroup,
              recurrenceGroupId: groupId,
            },
          });
        }

        // Apagar excesso se a nova grade for menor
        if (allTx.length > newDates.length) {
          const toDelete = allTx.slice(newDates.length).map((t) => t.id);
          await tx.transaction.deleteMany({
            where: { id: { in: toDelete } },
          });
        }

        return;
      }

      // ---------------------------------------------------------------
      // Término mudou → atualizar grupo inteiro e apagar excedentes
      // ---------------------------------------------------------------
      if (parsedNewEndDate !== null) {
        await tx.transaction.updateMany({
          where: { recurrenceGroupId: groupId },
          data: { recurrenceEndDate: parsedNewEndDate },
        });
        await tx.transaction.deleteMany({
          where: {
            recurrenceGroupId: groupId,
            date: { gt: parsedNewEndDate },
          },
        });
      }

      // ---------------------------------------------------------------
      // Data (date) com delta — respeita scope
      // ---------------------------------------------------------------
      if (date !== undefined) {
        const newDate = new Date(date);
        if (scope === 'single') {
          await tx.transaction.update({
            where: { id: transactionId },
            data: { date: newDate },
          });
        } else {
          const anchorDate = new Date(transaction.date);
          const deltaMs = newDate.getTime() - anchorDate.getTime();

          const futureTx = await tx.transaction.findMany({
            where: { recurrenceGroupId: groupId, date: { gte: anchorDate } },
            orderBy: { date: 'asc' },
          });

          for (const ft of futureTx) {
            await tx.transaction.update({
              where: { id: ft.id },
              data: {
                date: new Date(new Date(ft.date).getTime() + deltaMs),
              },
            });
          }
        }
      }

      // ---------------------------------------------------------------
      // Demais campos — respeitam scope
      // isPaid é individual por parcela; nunca propagado via future
      // ---------------------------------------------------------------
      const otherData: Record<string, unknown> = {};
      if (name !== undefined) otherData.name = name;
      if (type !== undefined) otherData.type = type;
      if (value !== undefined) otherData.value = value;
      if (bankAccountId !== undefined) otherData.bankAccountId = bankAccountId;
      if (categoryId !== undefined) otherData.categoryId = categoryId;

      if (scope === 'single') {
        const singleData: Record<string, unknown> = { ...otherData };
        if (isPaid !== undefined) singleData.isPaid = isPaid;

        if (Object.keys(singleData).length > 0) {
          await tx.transaction.update({
            where: { id: transactionId },
            data: singleData,
          });
        }
      } else {
        if (Object.keys(otherData).length === 0) return;

        await tx.transaction.updateMany({
          where: {
            recurrenceGroupId: groupId,
            date: { gte: transaction.date },
          },
          data: otherData,
        });
      }
    });

    return this.transactionsRepository.findFirst({
      where: { id: transactionId },
    });
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
