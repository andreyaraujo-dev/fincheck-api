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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanResponseDto } from './dto/plan-response.dto';
import { IsPublic } from '../../shared/decorators/is-public';
import { AdminGuard } from '../../shared/guards/admin.guard';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @IsPublic()
  @Get()
  @ApiOperation({ summary: 'Listar todos os planos (público)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de planos',
    type: [PlanResponseDto],
  })
  findAll() {
    return this.plansService.findAll();
  }

  @IsPublic()
  @Get(':id')
  @ApiOperation({ summary: 'Buscar plano por ID (público)' })
  @ApiParam({ name: 'id', description: 'ID do plano (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Dados do plano',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post()
  @ApiOperation({ summary: 'Criar plano (apenas admin)' })
  @ApiResponse({
    status: 201,
    description: 'Plano criado com sucesso',
    type: PlanResponseDto,
  })
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar plano (apenas admin)' })
  @ApiParam({ name: 'id', description: 'ID do plano (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Plano atualizado com sucesso',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Excluir plano (apenas admin)' })
  @ApiParam({ name: 'id', description: 'ID do plano (UUID)' })
  @ApiResponse({ status: 200, description: 'Plano excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.delete(id);
  }
}
