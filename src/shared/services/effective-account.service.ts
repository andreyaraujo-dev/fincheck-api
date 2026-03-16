import { ForbiddenException, Injectable } from '@nestjs/common';
import { SharedPersonsRepository } from '../database/repositories/shared-persons.repository';
import { SubscriptionsRepository } from '../database/repositories/subscriptions.repository';

@Injectable()
export class EffectiveAccountService {
  constructor(
    private readonly sharedPersonsRepository: SharedPersonsRepository,
    private readonly subscriptionsRepository: SubscriptionsRepository,
  ) {}

  /**
   * Returns the effective owner ID for data access.
   * - If user is owner (no SharedPerson): returns userId
   * - If user is shared (has active SharedPerson): returns ownerId
   * - Throws if shared user's owner has inactive subscription
   */
  async getEffectiveOwnerId(userId: string): Promise<string> {
    const sharedPerson = await this.sharedPersonsRepository.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!sharedPerson) {
      return userId;
    }

    const ownerId = sharedPerson.ownerId;

    const activeSubscription = await this.subscriptionsRepository.findFirst({
      where: { userId: ownerId, isActive: true },
    });

    if (!activeSubscription) {
      throw new ForbiddenException(
        'A assinatura desta conta está inativa. Apenas o dono pode acessar para reativar.',
      );
    }

    const now = new Date();
    const trialExpired =
      activeSubscription.isTrial &&
      activeSubscription.trialEndsAt &&
      activeSubscription.trialEndsAt < now;
    if (trialExpired) {
      throw new ForbiddenException(
        'A assinatura desta conta está inativa. Apenas o dono pode acessar para reativar.',
      );
    }

    return ownerId;
  }

  /**
   * Returns the shared person's access level if user is a shared user, null if owner.
   */
  async getSharedAccessLevel(
    userId: string,
  ): Promise<'READ_ONLY' | 'READ_WRITE' | 'READ_WRITE_RESTRICTED' | null> {
    const sharedPerson = await this.sharedPersonsRepository.findFirst({
      where: { userId, status: 'ACTIVE' },
    });
    return sharedPerson?.accessLevel ?? null;
  }

  /**
   * Check if the current user can perform delete operations.
   * READ_ONLY and READ_WRITE_RESTRICTED cannot delete.
   */
  async canDelete(userId: string, ownerId: string): Promise<boolean> {
    if (userId === ownerId) {
      return true;
    }

    const accessLevel = await this.getSharedAccessLevel(userId);
    if (!accessLevel) {
      return true;
    }

    return accessLevel === 'READ_WRITE';
  }

  /**
   * Resolves effective owner and validates access. Throws if shared user and owner subscription inactive.
   */
  async resolveAndValidate(userId: string): Promise<{
    effectiveOwnerId: string;
    isSharedUser: boolean;
    accessLevel: 'READ_ONLY' | 'READ_WRITE' | 'READ_WRITE_RESTRICTED' | null;
  }> {
    const sharedPerson = await this.sharedPersonsRepository.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!sharedPerson) {
      return {
        effectiveOwnerId: userId,
        isSharedUser: false,
        accessLevel: null,
      };
    }

    const ownerId = sharedPerson.ownerId;

    const activeSubscription = await this.subscriptionsRepository.findFirst({
      where: { userId: ownerId, isActive: true },
    });

    if (!activeSubscription) {
      throw new ForbiddenException(
        'A assinatura desta conta está inativa. Apenas o dono pode acessar para reativar.',
      );
    }

    const now = new Date();
    const trialExpired =
      activeSubscription.isTrial &&
      activeSubscription.trialEndsAt &&
      activeSubscription.trialEndsAt < now;
    if (trialExpired) {
      throw new ForbiddenException(
        'A assinatura desta conta está inativa. Apenas o dono pode acessar para reativar.',
      );
    }

    return {
      effectiveOwnerId: ownerId,
      isSharedUser: true,
      accessLevel: sharedPerson.accessLevel,
    };
  }
}
