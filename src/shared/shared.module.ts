import { FactoryProvider, Global, Module } from '@nestjs/common';
import { LoggerService } from './services/logger/logger.service';
import { SecretService } from './services/secret/secret.service';
import { EmailService } from './services/email/email.service';
import { EffectiveAccountService } from './services/effective-account.service';
import { EffectiveAccountGuard } from './guards/effective-account.guard';
import { CanDeleteGuard } from './guards/can-delete.guard';
import { AdminGuard } from './guards/admin.guard';
import { ConstantKeys } from './config/constant-keys';

const secretProviders: FactoryProvider[] = Object.values(ConstantKeys).map(
  (key: ConstantKeys): FactoryProvider => {
    return {
      inject: [SecretService],
      provide: key,
      useFactory: async (secretService: SecretService): Promise<string> =>
        secretService.fetchEnvSecret(key),
    };
  },
);

@Global()
@Module({
  providers: [
    LoggerService,
    SecretService,
    EmailService,
    EffectiveAccountService,
    EffectiveAccountGuard,
    CanDeleteGuard,
    AdminGuard,
    ...secretProviders,
  ],
  exports: [
    LoggerService,
    EmailService,
    EffectiveAccountService,
    EffectiveAccountGuard,
    CanDeleteGuard,
    AdminGuard,
    ...secretProviders,
  ],
})
export class SharedModule {}
