import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './services/categories.service';
import { ActiveUserId } from '../../shared/decorators/active-user-id';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryResponseDto, CategoriesWithTransactionsResponseDto } from './dto/category-response.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova categoria' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso', type: CategoryResponseDto })
  create(
    @ActiveUserId() userId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(userId, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as categorias do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de categorias', type: [CategoryResponseDto] })
  findAll(@ActiveUserId() userId: string) {
    return this.categoriesService.findAllByUserId(userId);
  }

  @Get('with-transactions')
  @ApiOperation({ summary: 'Listar categorias com dados de transações e orçamento' })
  @ApiResponse({ status: 200, description: 'Lista de categorias com resumo de gastos, orçamento e percentual utilizado', type: CategoriesWithTransactionsResponseDto })
  findAllWithTransactions(@ActiveUserId() userId: string) {
    return this.categoriesService.findAllCategoriesWithTransactionsData(userId);
  }

  @Get(':categoryId')
  @ApiOperation({ summary: 'Buscar uma categoria por ID' })
  @ApiParam({ name: 'categoryId', description: 'ID da categoria (UUID)' })
  @ApiResponse({ status: 200, description: 'Dados da categoria', type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  findOne(
    @ActiveUserId() userId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.categoriesService.findOne(userId, categoryId);
  }

  @Put(':categoryId')
  @ApiOperation({ summary: 'Atualizar uma categoria' })
  @ApiParam({ name: 'categoryId', description: 'ID da categoria (UUID)' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada com sucesso', type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  update(
    @ActiveUserId() userId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(userId, categoryId, updateCategoryDto);
  }

  @Delete(':categoryId')
  @ApiOperation({ summary: 'Excluir uma categoria' })
  @ApiParam({ name: 'categoryId', description: 'ID da categoria (UUID)' })
  @ApiResponse({ status: 200, description: 'Categoria excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  delete(
    @ActiveUserId() userId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.categoriesService.delete(userId, categoryId);
  }
}
