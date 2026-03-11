import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { SigninDto } from './dtos/signin.dto';
import { UsersRepository } from '../../shared/database/repositories/users.repository';
import { SubscriptionsRepository } from '../../shared/database/repositories/subscriptions.repository';
import { TrustedDevicesRepository } from '../../shared/database/repositories/trusted-devices.repository';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dtos/signup.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ConstantKeys } from '../../shared/config/constant-keys';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly trustedDevicesRepository: TrustedDevicesRepository,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
    @Inject(ConstantKeys.appUrl)
    private readonly appUrl: string,
  ) {}

  async signin(signinDto: SigninDto) {
    const { email, password, deviceFingerprint } = signinDto;
    const user = await this.usersRepository.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        isMfaEnabled: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const activeSubscription = await this.subscriptionsRepository.findFirst({
      where: { userId: user.id, isActive: true },
    });
    if (!activeSubscription) {
      throw new UnauthorizedException(
        'Assinatura inativa ou inexistente. Assine ou reative para acessar.',
      );
    }
    const now = new Date();
    const trialExpired =
      activeSubscription.isTrial &&
      activeSubscription.trialEndsAt &&
      activeSubscription.trialEndsAt < now;
    if (trialExpired) {
      throw new UnauthorizedException(
        'Período de trial encerrado. Assine para continuar acessando.',
      );
    }

    if (user.isMfaEnabled) {
      if (deviceFingerprint) {
        const trustedDevice = await this.trustedDevicesRepository.findTrusted(
          user.id,
          deviceFingerprint,
        );
        if (trustedDevice) {
          const accessToken = await this.generateAccessToken(user.id);
          return { accessToken };
        }
      }
      const mfaTempToken = await this.generateMfaTempToken(user.id);
      return { requiresMfa: true as const, mfaTempToken };
    }

    const accessToken = await this.generateAccessToken(user.id);

    return { accessToken };
  }

  async signup(signupDto: SignupDto) {
    const { name, email, password } = signupDto;
    const emailTaken = await this.usersRepository.findUnique({
      where: { email },
      select: { id: true },
    });
    if (emailTaken) throw new ConflictException('Email already taken');

    const hashedPassword = await hash(password, 12);

    const user = await this.usersRepository.create({
      data: {
        name,
        email,
        password: hashedPassword,
        subscriptions: {
          create: {
            value: 0,
            startDate: new Date(),
            nextRenewalAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            isActive: true,
            isTrial: true,
            trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        categories: {
          createMany: {
            data: [
              {
                name: 'Salário',
                icon: 'travel',
                type: 'INCOME',
              },
              {
                name: 'Freelance',
                icon: 'freelance',
                type: 'INCOME',
              },
              { name: 'Outro', icon: 'other', type: 'INCOME' },
              { name: 'Casa', icon: 'home', type: 'EXPENSE' },
              {
                name: 'Alimentação',
                icon: 'food',
                type: 'EXPENSE',
              },
              {
                name: 'Educação',
                icon: 'education',
                type: 'EXPENSE',
              },
              { name: 'Lazer', icon: 'fun', type: 'EXPENSE' },
              {
                name: 'Mercado',
                icon: 'grocery',
                type: 'EXPENSE',
              },
              {
                name: 'Roupas',
                icon: 'clothes',
                type: 'EXPENSE',
              },
              {
                name: 'Transporte',
                icon: 'transport',
                type: 'EXPENSE',
              },
              {
                name: 'Viagem',
                icon: 'travel',
                type: 'EXPENSE',
              },
              {
                name: 'Outro',
                icon: 'other',
                type: 'EXPENSE',
              },
            ],
          },
        },
      },
    });

    this.notificationsService.notify({
      userId: user.id,
      type: 'WELCOME',
      channel: 'BOTH',
      title: 'Bem-vindo ao myCash!',
      message:
        'Sua conta foi criada com sucesso. Aproveite o trial gratuito de 7 dias!',
      email: {
        to: email,
        subject: 'Bem-vindo ao myCash!',
        template: 'welcome',
        variables: { name },
      },
    });

    const accessToken = await this.generateAccessToken(user.id);

    return { accessToken };
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.usersRepository.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isCurrentPasswordValid = await compare(
      dto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Senha atual inválida.');
    }

    const hashedPassword = await hash(dto.newPassword, 12);
    await this.usersRepository.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findUnique({
      where: { email: dto.email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return;
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.usersRepository.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    const resetLink = `${this.appUrl}/reset-password?token=${token}`;

    this.notificationsService.notify({
      userId: user.id,
      type: 'PASSWORD_RESET',
      channel: 'EMAIL',
      title: 'Recuperação de senha',
      message: 'Solicitação de redefinição de senha recebida.',
      email: {
        to: user.email,
        subject: 'Recuperação de senha — myCash',
        template: 'password-reset',
        variables: { name: user.name, resetLink },
      },
    });
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersRepository.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Token inválido ou expirado. Solicite uma nova recuperação de senha.',
      );
    }

    const hashedPassword = await hash(dto.newPassword, 12);

    await this.usersRepository.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    this.notificationsService.notify({
      userId: user.id,
      type: 'PASSWORD_CHANGED',
      channel: 'EMAIL',
      title: 'Senha redefinida',
      message: 'Sua senha foi redefinida com sucesso.',
      email: {
        to: user.email,
        subject: 'Sua senha foi redefinida — myCash',
        template: 'password-changed',
        variables: { name: user.name },
      },
    });
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.usersRepository.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha inválida.');
    }

    await this.usersRepository.delete({ id: userId });
  }

  private async generateAccessToken(userId: string): Promise<string> {
    return this.jwtService.signAsync({ sub: userId });
  }

  private async generateMfaTempToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, mfaPending: true },
      { expiresIn: '5m' },
    );
  }
}
