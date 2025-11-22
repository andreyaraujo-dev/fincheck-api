import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../../../shared/database/repositories/categories.repository';
import { ValidateCategoryOwnershipService } from './validate-category-ownership.service';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly validateCategoryOwnershipService: ValidateCategoryOwnershipService,
  ) {}

  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    const { name, icon, type } = createCategoryDto;

    return this.categoriesRepository.create({
      data: { userId, name, icon, type },
    });
  }

  async findAllByUserId(userId: string) {
    return this.categoriesRepository.findMany({ where: { userId: userId } });
  }

  async findOne(userId: string, categoryId: string) {
    await this.validateCategoryOwnershipService.validate(userId, categoryId);

    return this.categoriesRepository.findFirst({
      where: { id: categoryId, userId: userId },
    });
  }

  async update(
    userId: string,
    categoryId: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    await this.validateCategoryOwnershipService.validate(userId, categoryId);

    return this.categoriesRepository.update({
      where: { id: categoryId, userId: userId },
      data: updateCategoryDto,
    });
  }

  async delete(userId: string, categoryId: string) {
    await this.validateCategoryOwnershipService.validate(userId, categoryId);

    return this.categoriesRepository.delete({
      where: { id: categoryId, userId: userId },
    });
  }
}
