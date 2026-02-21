import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GoalsService } from './services/goals.service';
import { GoalOperationsService } from './services/goal-operations.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateGoalOperationDto } from './dto/create-goal-operation.dto';
import { DeleteGoalDto } from './dto/delete-goal.dto';
import { GoalResponseDto, GoalOperationResponseDto } from './dto/goal-response.dto';
import { ActiveUserId } from '../../shared/decorators/active-user-id';
import { OptionalParseUuidPipe } from '../../shared/pipes/optional-parse-uuid.pipe';
import { OptionalParseEnumPipe } from '../../shared/pipes/optional-parse-enum.pipe';
import {
  GoalStatus,
  GoalImportance,
  GoalPriority,
} from './entities/goal.entity';

@ApiTags('Goals')
@ApiBearerAuth()
@Controller('goals')
export class GoalsController {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly goalOperationsService: GoalOperationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova meta' })
  @ApiResponse({ status: 201, description: 'Meta criada com sucesso', type: GoalResponseDto })
  create(@ActiveUserId() userId: string, @Body() createGoalDto: CreateGoalDto) {
    return this.goalsService.create(userId, createGoalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar metas do usuário com filtros opcionais' })
  @ApiQuery({ name: 'name', required: false, description: 'Filtrar por nome' })
  @ApiQuery({ name: 'status', required: false, enum: GoalStatus, description: 'Filtrar por status' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrar por ID da categoria (UUID)' })
  @ApiQuery({ name: 'importance', required: false, enum: GoalImportance, description: 'Filtrar por importância' })
  @ApiQuery({ name: 'priority', required: false, enum: GoalPriority, description: 'Filtrar por prioridade' })
  @ApiQuery({ name: 'dueDateFrom', required: false, description: 'Data limite mínima (ISO 8601)' })
  @ApiQuery({ name: 'dueDateTo', required: false, description: 'Data limite máxima (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Lista de metas com dados da categoria', type: [GoalResponseDto] })
  findAll(
    @ActiveUserId() userId: string,
    @Query('name') name?: string,
    @Query('status', new OptionalParseEnumPipe(GoalStatus)) status?: GoalStatus,
    @Query('categoryId', OptionalParseUuidPipe) categoryId?: string,
    @Query('importance', new OptionalParseEnumPipe(GoalImportance))
    importance?: GoalImportance,
    @Query('priority', new OptionalParseEnumPipe(GoalPriority))
    priority?: GoalPriority,
    @Query('dueDateFrom') dueDateFrom?: string,
    @Query('dueDateTo') dueDateTo?: string,
  ) {
    return this.goalsService.findAllByUserId(userId, {
      name,
      status,
      categoryId,
      importance,
      priority,
      dueDateFrom,
      dueDateTo,
    });
  }

  @Get(':goalId')
  @ApiOperation({ summary: 'Buscar uma meta por ID' })
  @ApiParam({ name: 'goalId', description: 'ID da meta (UUID)' })
  @ApiResponse({ status: 200, description: 'Dados da meta com categoria', type: GoalResponseDto })
  @ApiResponse({ status: 404, description: 'Meta não encontrada' })
  findOne(
    @ActiveUserId() userId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
  ) {
    return this.goalsService.findOne(userId, goalId);
  }

  @Put(':goalId')
  @ApiOperation({ summary: 'Atualizar uma meta' })
  @ApiParam({ name: 'goalId', description: 'ID da meta (UUID)' })
  @ApiResponse({ status: 200, description: 'Meta atualizada com sucesso', type: GoalResponseDto })
  @ApiResponse({ status: 404, description: 'Meta não encontrada' })
  update(
    @ActiveUserId() userId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalsService.update(userId, goalId, updateGoalDto);
  }

  @Delete(':goalId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir uma meta' })
  @ApiParam({ name: 'goalId', description: 'ID da meta (UUID)' })
  @ApiResponse({ status: 204, description: 'Meta excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Meta não encontrada' })
  remove(
    @ActiveUserId() userId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() deleteGoalDto: DeleteGoalDto,
  ) {
    return this.goalsService.remove(
      userId,
      goalId,
      deleteGoalDto.deleteTransactions,
    );
  }

  @Get(':goalId/operations')
  @ApiOperation({ summary: 'Listar operações de uma meta' })
  @ApiParam({ name: 'goalId', description: 'ID da meta (UUID)' })
  @ApiResponse({ status: 200, description: 'Lista de operações com dados da conta bancária', type: [GoalOperationResponseDto] })
  @ApiResponse({ status: 404, description: 'Meta não encontrada' })
  getOperations(
    @ActiveUserId() userId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
  ) {
    return this.goalOperationsService.getOperations(userId, goalId);
  }

  @Post(':goalId/operations')
  @ApiOperation({ summary: 'Criar uma operação em uma meta (depósito, saque ou ajuste manual)' })
  @ApiParam({ name: 'goalId', description: 'ID da meta (UUID)' })
  @ApiResponse({ status: 201, description: 'Operação criada com sucesso', type: GoalOperationResponseDto })
  @ApiResponse({ status: 400, description: 'Meta cancelada, conta bancária obrigatória ou saldo insuficiente' })
  @ApiResponse({ status: 404, description: 'Meta não encontrada' })
  createOperation(
    @ActiveUserId() userId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() createOperationDto: CreateGoalOperationDto,
  ) {
    return this.goalOperationsService.createOperation(
      userId,
      goalId,
      createOperationDto,
    );
  }
}
