import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../shared/database/repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getUserById(userId: string) {
    return this.usersRepository.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        isMfaEnabled: true,
      },
    });
  }

  async updateName(userId: string, name: string) {
    return this.usersRepository.update({
      where: { id: userId },
      data: { name },
      select: { name: true, email: true, isMfaEnabled: true },
    });
  }
}
