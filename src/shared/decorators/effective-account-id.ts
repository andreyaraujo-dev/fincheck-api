import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const EffectiveAccountId = createParamDecorator<undefined>(
  (data, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const effectiveOwnerId = request.effectiveOwnerId;

    if (!effectiveOwnerId) {
      throw new UnauthorizedException(
        'Effective account not resolved. Ensure EffectiveAccountGuard is applied.',
      );
    }

    return effectiveOwnerId;
  },
);
