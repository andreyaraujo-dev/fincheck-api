import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../shared/database/repositories/users.repository';
import { EffectiveAccountService } from '../../shared/services/effective-account.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly effectiveAccountService: EffectiveAccountService,
  ) {}

  async getUserById(userId: string) {
    const [user, sharedAccessLevel] = await Promise.all([
      this.usersRepository.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          isMfaEnabled: true,
        },
      }),
      this.effectiveAccountService.getSharedAccessLevel(userId),
    ]);

    if (!user) return null;

    const isAccountOwner = sharedAccessLevel === null;

    return {
      ...user,
      ...(sharedAccessLevel && { sharedAccessLevel }),
      isAccountOwner,
    };
  }

  async updateName(userId: string, name: string) {
    return this.usersRepository.update({
      where: { id: userId },
      data: { name },
      select: { name: true, email: true, isMfaEnabled: true },
    });
  }
}
