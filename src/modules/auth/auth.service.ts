import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SigninDto } from './dtos/signin.dto';
import { UsersRepository } from '../../shared/database/repositories/users.repository';
import { SubscriptionsRepository } from '../../shared/database/repositories/subscriptions.repository';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dtos/signup.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signin(signinDto: SigninDto) {
    const { email, password } = signinDto;
    const user = await this.usersRepository.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException(`Invalid credentials.`);
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(`Invalid credentials.`);
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
}
