import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EffectiveAccountService } from '../services/effective-account.service';

@Injectable()
export class EffectiveAccountGuard implements CanActivate {
  constructor(
    private readonly effectiveAccountService: EffectiveAccountService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.userId;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const { effectiveOwnerId, isSharedUser, accessLevel } =
      await this.effectiveAccountService.resolveAndValidate(userId);

    request.effectiveOwnerId = effectiveOwnerId;
    request.isSharedUser = isSharedUser;
    request.sharedAccessLevel = accessLevel;

    return true;
  }
}
