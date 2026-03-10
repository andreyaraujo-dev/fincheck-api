import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MfaService } from './services/mfa.service';
import { JwtModule } from '@nestjs/jwt';
import { ConstantKeys } from '../../shared/config/constant-keys';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConstantKeys.jwtSecret],
      useFactory: async (jwtSecret: string) => ({
        global: true,
        secret: jwtSecret,
        signOptions: { expiresIn: '7d' },
      }),
    }),
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MfaService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}
