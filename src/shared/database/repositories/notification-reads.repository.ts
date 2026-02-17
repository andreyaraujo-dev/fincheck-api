import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { type Prisma } from '@prisma/client';

@Injectable()
export class NotificationReadsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDto: Prisma.NotificationReadCreateArgs) {
    return this.prismaService.notificationRead.create(createDto);
  }

  findFirst(findFirstDto: Prisma.NotificationReadFindFirstArgs) {
    return this.prismaService.notificationRead.findFirst(findFirstDto);
  }

  findMany(findManyDto: Prisma.NotificationReadFindManyArgs) {
    return this.prismaService.notificationRead.findMany(findManyDto);
  }
}
