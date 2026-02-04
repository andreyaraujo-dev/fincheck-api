import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { type Prisma } from '@prisma/client';

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDto: Prisma.SubscriptionCreateArgs) {
    return this.prismaService.subscription.create(createDto);
  }

  findUnique(findUniqueDto: Prisma.SubscriptionFindUniqueArgs) {
    return this.prismaService.subscription.findUnique(findUniqueDto);
  }

  findFirst(findFirstDto: Prisma.SubscriptionFindFirstArgs) {
    return this.prismaService.subscription.findFirst(findFirstDto);
  }

  findMany(findManyDto: Prisma.SubscriptionFindManyArgs) {
    return this.prismaService.subscription.findMany(findManyDto);
  }

  update(updateDto: Prisma.SubscriptionUpdateArgs) {
    return this.prismaService.subscription.update(updateDto);
  }
}
