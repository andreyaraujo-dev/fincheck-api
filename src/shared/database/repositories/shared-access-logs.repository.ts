import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { type Prisma } from '@prisma/client';

@Injectable()
export class SharedAccessLogsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDto: Prisma.SharedAccessLogCreateArgs) {
    return this.prismaService.sharedAccessLog.create(createDto);
  }

  findMany(findManyDto: Prisma.SharedAccessLogFindManyArgs) {
    return this.prismaService.sharedAccessLog.findMany(findManyDto);
  }
}
