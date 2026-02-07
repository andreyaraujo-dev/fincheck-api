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
    };
  }

  static toDomainMany(transactions: any[]) {
    return transactions.map(this.toDomain);
  }
}
