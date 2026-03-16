import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { type Prisma } from '@prisma/client';

@Injectable()
export class SharedPersonsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDto: Prisma.SharedPersonCreateArgs) {
    return this.prismaService.sharedPerson.create(createDto);
  }

  findUnique(findUniqueDto: Prisma.SharedPersonFindUniqueArgs) {
    return this.prismaService.sharedPerson.findUnique(findUniqueDto);
  }

  findFirst(findFirstDto: Prisma.SharedPersonFindFirstArgs) {
    return this.prismaService.sharedPerson.findFirst(findFirstDto);
  }

  findMany(findManyDto: Prisma.SharedPersonFindManyArgs) {
    return this.prismaService.sharedPerson.findMany(findManyDto);
  }

  update(updateDto: Prisma.SharedPersonUpdateArgs) {
    return this.prismaService.sharedPerson.update(updateDto);
  }

  delete(deleteDto: Prisma.SharedPersonDeleteArgs) {
    return this.prismaService.sharedPerson.delete(deleteDto);
  }

  count(countDto: Prisma.SharedPersonCountArgs) {
    return this.prismaService.sharedPerson.count(countDto);
  }
}
