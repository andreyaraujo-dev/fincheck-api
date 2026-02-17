import { Injectable } from '@nestjs/common';
import { NotificationType, NotificationChannel } from '@prisma/client';
import { NotificationsRepository } from '../../shared/database/repositories/notifications.repository';
import { NotificationReadsRepository } from '../../shared/database/repositories/notification-reads.repository';
import { EmailService } from '../../shared/services/email/email.service';
import { LoggerService } from '../../shared/services/logger/logger.service';

interface NotifyParams {
  userId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  email?: {
    to: string;
    subject: string;
    template: string;
    variables?: Record<string, string>;
  };
}

interface QueryNotificationsParams {
  page?: number;
  unreadOnly?: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationReadsRepository: NotificationReadsRepository,
    private readonly emailService: EmailService,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setContext(NotificationsService.name);
  }

  async notify(params: NotifyParams) {
    const { userId, type, channel, title, message, metadata, email } = params;

    if (channel === 'IN_APP' || channel === 'BOTH') {
      await this.notificationsRepository.create({
        data: {
          userId: userId ?? null,
          type,
          channel,
          title,
          message,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
      });
    }

    if ((channel === 'EMAIL' || channel === 'BOTH') && email) {
      this.emailService
        .sendEmail(
          email.to,
          email.subject,
          email.template,
          email.variables ?? {},
        )
        .catch((error) => {
          this.loggerService.error(
            `Falha ao enviar email de notificação (${type}): ${error.message}`,
          );
        });
    }
  }

  async findAll(userId: string, query: QueryNotificationsParams) {
    const page = query.page ?? 1;
    const take = 20;
    const skip = (page - 1) * take;

    const notifications = await this.notificationsRepository.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        readBy: {
          where: { userId },
          select: { readAt: true },
        },
      },
    });

    const total = await this.notificationsRepository.count({
      where: {
        OR: [{ userId }, { userId: null }],
      },
    });

    const items = notifications.map((n) => {
      const { readBy, ...notification } = n as typeof n & {
        readBy: { readAt: Date }[];
      };
      return {
        ...notification,
        read: readBy.length > 0,
        readAt: readBy[0]?.readAt ?? null,
      };
    });

    if (query.unreadOnly) {
      return {
        data: items.filter((item) => !item.read),
        meta: { page, totalPages: Math.ceil(total / take), total },
      };
    }

    return {
      data: items,
      meta: { page, totalPages: Math.ceil(total / take), total },
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const readNotificationIds = await this.notificationReadsRepository.findMany(
      {
        where: { userId },
        select: { notificationId: true },
      },
    );

    const readIds = readNotificationIds.map((r) => r.notificationId);

    return this.notificationsRepository.count({
      where: {
        OR: [{ userId }, { userId: null }],
        id: { notIn: readIds },
      },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const existing = await this.notificationReadsRepository.findFirst({
      where: { notificationId, userId },
    });

    if (existing) return existing;

    return this.notificationReadsRepository.create({
      data: { notificationId, userId },
    });
  }

  async markAllAsRead(userId: string) {
    const unreadNotifications = await this.notificationsRepository.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
      },
      select: { id: true },
    });

    const readNotifications = await this.notificationReadsRepository.findMany({
      where: { userId },
      select: { notificationId: true },
    });

    const readIds = new Set(readNotifications.map((r) => r.notificationId));
    const toMark = unreadNotifications.filter((n) => !readIds.has(n.id));

    for (const notification of toMark) {
      await this.notificationReadsRepository.create({
        data: { notificationId: notification.id, userId },
      });
    }

    return { marked: toMark.length };
  }
}
