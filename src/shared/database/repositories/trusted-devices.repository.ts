import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class TrustedDevicesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findTrusted(userId: string, deviceFingerprint: string) {
    const normalized = deviceFingerprint?.trim();
    if (!normalized) return null;
    const now = new Date();
    return this.prismaService.trustedDevice.findFirst({
      where: {
        userId,
        deviceFingerprint: normalized,
        expiresAt: { gt: now },
      },
    });
  }

  create(userId: string, deviceFingerprint: string) {
    const normalized = deviceFingerprint?.trim();
    if (!normalized) return null;
    const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
    return this.prismaService.trustedDevice.upsert({
      where: {
        userId_deviceFingerprint: { userId, deviceFingerprint: normalized },
      },
      create: {
        userId,
        deviceFingerprint: normalized,
        expiresAt,
      },
      update: { expiresAt },
    });
  }

  deleteByUserId(userId: string) {
    return this.prismaService.trustedDevice.deleteMany({
      where: { userId },
    });
  }
}
