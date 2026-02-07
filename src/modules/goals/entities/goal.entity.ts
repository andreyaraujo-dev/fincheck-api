export enum GoalStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum GoalImportance {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Goal {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  dueDate: Date | string;
  status: GoalStatus;
  importance: GoalImportance;
  priority: GoalPriority;
  createdAt: Date | string;
  updatedAt: Date | string;
  category?: {
    id: string;
    name: string;
    icon: string;
  };
}
