import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersRepository } from '../database/repositories/users.repository';

const ADMIN_EMAIL = 'andreyaraujo.dev@gmail.com';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersRepository: UsersRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.userId;

    if (!userId) {
      throw new ForbiddenException('Acesso negado.');
    }

    const user = await this.usersRepository.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || user.email !== ADMIN_EMAIL) {
      throw new ForbiddenException('Acesso restrito ao administrador.');
    }

    return true;
  }
}
