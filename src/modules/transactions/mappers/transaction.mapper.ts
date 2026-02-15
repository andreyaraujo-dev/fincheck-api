export class TransactionMapper {
  static toDomain(transaction: any) {
    return {
      id: transaction.id,
      userId: transaction.user_id,
      bankAccountId: transaction.bank_account_id,
      categoryId: transaction.category_id,
      name: transaction.name,
      value: transaction.value,
      date: transaction.date,
      type: transaction.type,
      isPaid: transaction.is_paid,
      recurrenceFrequency: transaction.recurrence_frequency ?? null,
      recurrenceEndDate: transaction.recurrence_end_date ?? null,
      recurrenceGroupId: transaction.recurrence_group_id ?? null,
    };
  }

  static toDomainMany(transactions: any[]) {
    return transactions.map(this.toDomain);
  }
}
