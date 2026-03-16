import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { type Prisma } from '@prisma/client';

@Injectable()
export class PlansRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDto: Prisma.PlanCreateArgs) {
    return this.prismaService.plan.create(createDto);
  }

  findUnique(findUniqueDto: Prisma.PlanFindUniqueArgs) {
    return this.prismaService.plan.findUnique(findUniqueDto);
  }

  findFirst(findFirstDto: Prisma.PlanFindFirstArgs) {
    return this.prismaService.plan.findFirst(findFirstDto);
  }

  findMany(findManyDto: Prisma.PlanFindManyArgs) {
    return this.prismaService.plan.findMany(findManyDto);
  }

  update(updateDto: Prisma.PlanUpdateArgs) {
    return this.prismaService.plan.update(updateDto);
  }

  delete(deleteDto: Prisma.PlanDeleteArgs) {
    return this.prismaService.plan.delete(deleteDto);
  }
}
