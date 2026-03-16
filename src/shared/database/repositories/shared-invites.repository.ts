import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { type Prisma } from '@prisma/client';

@Injectable()
export class SharedInvitesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDto: Prisma.SharedInviteCreateArgs) {
    return this.prismaService.sharedInvite.create(createDto);
  }

  findUnique(findUniqueDto: Prisma.SharedInviteFindUniqueArgs) {
    return this.prismaService.sharedInvite.findUnique(findUniqueDto);
  }

  findFirst(findFirstDto: Prisma.SharedInviteFindFirstArgs) {
    return this.prismaService.sharedInvite.findFirst(findFirstDto);
  }

  delete(deleteDto: Prisma.SharedInviteDeleteArgs) {
    return this.prismaService.sharedInvite.delete(deleteDto);
  }

  deleteMany(deleteManyDto: Prisma.SharedInviteDeleteManyArgs) {
    return this.prismaService.sharedInvite.deleteMany(deleteManyDto);
  }
}
