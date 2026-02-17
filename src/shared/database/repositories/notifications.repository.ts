import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { type Prisma } from '@prisma/client';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDto: Prisma.NotificationCreateArgs) {
    return this.prismaService.notification.create(createDto);
  }

  findMany(findManyDto: Prisma.NotificationFindManyArgs) {
    return this.prismaService.notification.findMany(findManyDto);
  }

  count(countDto: Prisma.NotificationCountArgs) {
    return this.prismaService.notification.count(countDto);
  }

  deleteMany(deleteManyDto: Prisma.NotificationDeleteManyArgs) {
    return this.prismaService.notification.deleteMany(deleteManyDto);
  }
}
