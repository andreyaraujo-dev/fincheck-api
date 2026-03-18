import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { type Prisma } from '@prisma/client';

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDto: Prisma.TransactionCreateArgs) {
    return this.prismaService.transaction.create(createDto);
  }

  findMany(findManyDto: Prisma.TransactionFindManyArgs) {
    return this.prismaService.transaction.findMany(findManyDto);
  }

  findUnique(findUniqueDto: Prisma.TransactionFindUniqueArgs) {
    return this.prismaService.transaction.findUnique(findUniqueDto);
  }

  findFirst(findFirstDto: Prisma.TransactionFindFirstArgs) {
    return this.prismaService.transaction.findFirst(findFirstDto);
  }

  update(updateDto: Prisma.TransactionUpdateArgs) {
    return this.prismaService.transaction.update(updateDto);
  }

  delete(deleteDto: Prisma.TransactionDeleteArgs) {
    return this.prismaService.transaction.delete(deleteDto);
  }

  deleteMany(deleteManyDto: Prisma.TransactionDeleteManyArgs) {
    return this.prismaService.transaction.deleteMany(deleteManyDto);
  }

  createMany(createManyDto: Prisma.TransactionCreateManyArgs) {
    return this.prismaService.transaction.createMany(createManyDto);
  }

  updateMany(updateManyDto: Prisma.TransactionUpdateManyArgs) {
    return this.prismaService.transaction.updateMany(updateManyDto);
  }

  findManyByGroupId(groupId: string, afterDate?: Date) {
    return this.prismaService.transaction.findMany({
      where: {
        recurrenceGroupId: groupId,
        ...(afterDate && { date: { gte: afterDate } }),
      },
      orderBy: { date: 'asc' },
    });
  }

  updateManyByGroupId(
    groupId: string,
    afterDate: Date,
    data: Prisma.TransactionUpdateManyMutationInput,
  ) {
    return this.prismaService.transaction.updateMany({
      where: {
        recurrenceGroupId: groupId,
        date: { gte: afterDate },
      },
      data,
    });
  }

  deleteManyByGroupId(groupId: string, afterDate?: Date) {
    return this.prismaService.transaction.deleteMany({
      where: {
        recurrenceGroupId: groupId,
        ...(afterDate && { date: { gte: afterDate } }),
      },
    });
  }

  findPaidUntilDate(userId: string, endDate: Date, bankAccountId?: string) {
    return this.prismaService.transaction.findMany({
      where: {
        userId,
        date: { lte: endDate },
        isPaid: true,
        ...(bankAccountId && { bankAccountId }),
      },
      select: {
        bankAccountId: true,
        type: true,
        value: true,
        categoryId: true,
      },
    });
  }

  findMonthTransactions(
    userId: string,
    month: number,
    year: number,
    bankAccountId?: string,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    return this.prismaService.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lt: endDate },
        isPaid: true,
        ...(bankAccountId && { bankAccountId }),
      },
      select: {
        type: true,
        value: true,
        categoryId: true,
        recurrenceGroupId: true,
        recurrenceEndDate: true,
      },
    });
  }

  findRecurringTemplates(userId: string) {
    return this.prismaService.transaction.findMany({
      where: {
        userId,
        recurrenceGroupId: { not: null },
      },
      select: {
        recurrenceGroupId: true,
        recurrenceFrequency: true,
        recurrenceEndDate: true,
        value: true,
        type: true,
        bankAccountId: true,
        categoryId: true,
        name: true,
        date: true,
      },
      orderBy: [{ recurrenceGroupId: 'asc' }, { date: 'asc' }],
    });
  }

  async findManyWithNormalizedSearch(params: {
    userId: string;
    month: number;
    year: number;
    bankAccountId?: string;
    type?: string;
    isPaid?: boolean;
    title?: string;
  }) {
    const { userId, month, year, bankAccountId, type, isPaid, title } = params;

    // Construir a query SQL com unaccent
    let query = `
      SELECT * FROM transactions
      WHERE user_id = $1::uuid
      AND EXTRACT(MONTH FROM date) = $2
      AND EXTRACT(YEAR FROM date) = $3
    `;

    const queryParams: any[] = [userId, month, year];
    let paramIndex = 4;

    if (bankAccountId) {
      query += ` AND bank_account_id = $${paramIndex}::uuid`;
      queryParams.push(bankAccountId);
      paramIndex++;
    }

    if (type) {
      query += ` AND type = $${paramIndex}::transaction_type`;
      queryParams.push(type);
      paramIndex++;
    }

    if (isPaid !== undefined) {
      query += ` AND is_paid = $${paramIndex}`;
      queryParams.push(isPaid);
      paramIndex++;
    }

    if (title) {
      query += ` AND unaccent(LOWER(name)) LIKE unaccent(LOWER($${paramIndex}))`;
      queryParams.push(`%${title}%`);
    }

    query += ` ORDER BY date DESC`;

    return this.prismaService.$queryRawUnsafe(query, ...queryParams);
  }
}
