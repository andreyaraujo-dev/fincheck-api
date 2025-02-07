import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConstantKeys } from '../../shared/config/constant-keys';
import { AuthGuard } from './auth.guard';
import { AuthStrategy } from './auth.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConstantKeys.jwtSecret],
      useFactory: async (jwtSecret: string) => ({
        global: true,
        secret: jwtSecret,
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, AuthStrategy],
})
export class AuthModule {}
