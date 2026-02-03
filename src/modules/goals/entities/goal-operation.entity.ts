export enum GoalOperationType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  MANUAL = 'MANUAL',
}

export interface GoalOperation {
  id: string;
  goalId: string;
  type: GoalOperationType;
  value: number;
  bankAccountId?: string;
  transactionId?: string;
  description?: string;
  createdAt: Date | string;
  bankAccount?: {
    id: string;
    name: string;
  };
}
