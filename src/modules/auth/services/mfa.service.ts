import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { UsersRepository } from '../../../shared/database/repositories/users.repository';
import { TrustedDevicesRepository } from '../../../shared/database/repositories/trusted-devices.repository';

@Injectable()
export class MfaService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly trustedDevicesRepository: TrustedDevicesRepository,
    private readonly jwtService: JwtService,
  ) {}

  async setupMfa(userId: string) {
    const user = await this.usersRepository.findUnique({
      where: { id: userId },
      select: { email: true, isMfaEnabled: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    if (user.isMfaEnabled) {
      throw new BadRequestException('MFA já está habilitado.');
    }

    const { base32, otpauth_url } = speakeasy.generateSecret({
      name: `myCash (${user.email})`,
      issuer: 'myCash',
      length: 32,
    });

    await this.usersRepository.update({
      where: { id: userId },
      data: {
        mfaSecret: base32,
        isMfaEnabled: false,
      },
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauth_url!);

    return {
      qrCodeDataUrl,
      secret: base32,
    };
  }

  async verifySetup(userId: string, token: string) {
    const user = await this.usersRepository.findUnique({
      where: { id: userId },
      select: { mfaSecret: true },
    });

    if (!user?.mfaSecret) {
      throw new BadRequestException(
        'Setup de MFA não iniciado. Chame /auth/mfa/setup primeiro.',
      );
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValid) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    await this.usersRepository.update({
      where: { id: userId },
      data: { isMfaEnabled: true },
    });
  }

  async disableMfa(userId: string, password: string) {
    const user = await this.usersRepository.findUnique({
      where: { id: userId },
      select: { password: true, isMfaEnabled: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    if (!user.isMfaEnabled) {
      throw new BadRequestException('MFA não está habilitado.');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha inválida.');
    }

    await this.usersRepository.update({
      where: { id: userId },
      data: {
        mfaSecret: null,
        isMfaEnabled: false,
      },
    });

    await this.trustedDevicesRepository.deleteByUserId(userId);
  }

  async verifyToken(
    mfaTempToken: string,
    token: string,
    trustDevice?: boolean,
    deviceFingerprint?: string,
  ) {
    let payload: { sub?: string; mfaPending?: boolean };

    try {
      payload = this.jwtService.verify(mfaTempToken, {
        ignoreExpiration: false,
      });
    } catch {
      throw new UnauthorizedException(
        'Token temporário inválido ou expirado. Faça login novamente.',
      );
    }

    if (!payload.mfaPending || !payload.sub) {
      throw new UnauthorizedException('Token inválido para verificação MFA.');
    }

    const userId = payload.sub;

    const user = await this.usersRepository.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, isMfaEnabled: true },
    });

    if (!user?.mfaSecret || !user.isMfaEnabled) {
      throw new UnauthorizedException('MFA não configurado para este usuário.');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValid) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    if (trustDevice && deviceFingerprint) {
      await this.trustedDevicesRepository.create(userId, deviceFingerprint);
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: userId },
      { expiresIn: '7d' },
    );

    return { accessToken };
  }
}
