import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './services/categories.service';
import { EffectiveAccountId } from '../../shared/decorators/effective-account-id';
import { EffectiveAccountGuard } from '../../shared/guards/effective-account.guard';
import { CanDeleteGuard } from '../../shared/guards/can-delete.guard';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryResponseDto, CategoriesWithTransactionsResponseDto } from './dto/category-response.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(EffectiveAccountGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova categoria' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso', type: CategoryResponseDto })
  create(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(effectiveOwnerId, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as categorias do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de categorias', type: [CategoryResponseDto] })
  findAll(@EffectiveAccountId() effectiveOwnerId: string) {
    return this.categoriesService.findAllByUserId(effectiveOwnerId);
  }

  @Get('with-transactions')
  @ApiOperation({ summary: 'Listar categorias com dados de transações e orçamento' })
  @ApiResponse({ status: 200, description: 'Lista de categorias com resumo de gastos, orçamento e percentual utilizado', type: CategoriesWithTransactionsResponseDto })
  findAllWithTransactions(@EffectiveAccountId() effectiveOwnerId: string) {
    return this.categoriesService.findAllCategoriesWithTransactionsData(effectiveOwnerId);
  }

  @Get(':categoryId')
  @ApiOperation({ summary: 'Buscar uma categoria por ID' })
  @ApiParam({ name: 'categoryId', description: 'ID da categoria (UUID)' })
  @ApiResponse({ status: 200, description: 'Dados da categoria', type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  findOne(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.categoriesService.findOne(effectiveOwnerId, categoryId);
  }

  @Put(':categoryId')
  @ApiOperation({ summary: 'Atualizar uma categoria' })
  @ApiParam({ name: 'categoryId', description: 'ID da categoria (UUID)' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada com sucesso', type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  update(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(effectiveOwnerId, categoryId, updateCategoryDto);
  }

  @Delete(':categoryId')
  @UseGuards(CanDeleteGuard)
  @ApiOperation({ summary: 'Excluir uma categoria' })
  @ApiParam({ name: 'categoryId', description: 'ID da categoria (UUID)' })
  @ApiResponse({ status: 200, description: 'Categoria excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  delete(
    @EffectiveAccountId() effectiveOwnerId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.categoriesService.delete(effectiveOwnerId, categoryId);
  }
}
