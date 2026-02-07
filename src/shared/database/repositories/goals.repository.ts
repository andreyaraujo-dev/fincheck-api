import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { type Prisma } from '@prisma/client';

@Injectable()
export class GoalsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDto: Prisma.GoalCreateArgs) {
    return this.prismaService.goal.create(createDto);
  }

  findMany(findManyDto: Prisma.GoalFindManyArgs) {
    return this.prismaService.goal.findMany(findManyDto);
  }

  findFirst(findFirstDto: Prisma.GoalFindFirstArgs) {
    return this.prismaService.goal.findFirst(findFirstDto);
  }

  update(updateDto: Prisma.GoalUpdateArgs) {
    return this.prismaService.goal.update(updateDto);
  }

  delete(deleteDto: Prisma.GoalDeleteArgs) {
    return this.prismaService.goal.delete(deleteDto);
  }
}
