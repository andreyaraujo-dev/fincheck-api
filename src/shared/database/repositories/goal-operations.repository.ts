import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { type Prisma } from '@prisma/client';

@Injectable()
export class GoalOperationsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDto: Prisma.GoalOperationCreateArgs) {
    return this.prismaService.goalOperation.create(createDto);
  }

  findMany(findManyDto: Prisma.GoalOperationFindManyArgs) {
    return this.prismaService.goalOperation.findMany(findManyDto);
  }
}
