import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class CanDeleteGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const accessLevel = request.sharedAccessLevel;

    if (
      accessLevel === 'READ_ONLY' ||
      accessLevel === 'READ_WRITE_RESTRICTED'
    ) {
      throw new ForbiddenException(
        'Seu nível de acesso não permite excluir dados.',
      );
    }

    return true;
  }
}
