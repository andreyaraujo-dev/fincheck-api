import { Injectable, NotFoundException } from '@nestjs/common';
import { GoalsRepository } from '../../../shared/database/repositories/goals.repository';

@Injectable()
export class ValidateGoalOwnershipService {
  constructor(private readonly goalsRepository: GoalsRepository) {}

  async validate(userId: string, goalId: string) {
    const isOwner = await this.goalsRepository.findFirst({
      where: { userId, id: goalId },
    });

    if (!isOwner) {
      throw new NotFoundException('Goal not found');
    }
  }
}
