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
import { GoalsService } from './services/goals.service';
import { GoalOperationsService } from './services/goal-operations.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateGoalOperationDto } from './dto/create-goal-operation.dto';
import { DeleteGoalDto } from './dto/delete-goal.dto';
import { ActiveUserId } from '../../shared/decorators/active-user-id';
import { OptionalParseUuidPipe } from '../../shared/pipes/optional-parse-uuid.pipe';
import { OptionalParseEnumPipe } from '../../shared/pipes/optional-parse-enum.pipe';
import {
  GoalStatus,
  GoalImportance,
  GoalPriority,
} from './entities/goal.entity';

@Controller('goals')
export class GoalsController {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly goalOperationsService: GoalOperationsService,
  ) {}

  @Post()
  create(@ActiveUserId() userId: string, @Body() createGoalDto: CreateGoalDto) {
    return this.goalsService.create(userId, createGoalDto);
  }

  @Get()
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
  findOne(
    @ActiveUserId() userId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
  ) {
    return this.goalsService.findOne(userId, goalId);
  }

  @Put(':goalId')
  update(
    @ActiveUserId() userId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalsService.update(userId, goalId, updateGoalDto);
  }

  @Delete(':goalId')
  @HttpCode(HttpStatus.NO_CONTENT)
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
  getOperations(
    @ActiveUserId() userId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
  ) {
    return this.goalOperationsService.getOperations(userId, goalId);
  }

  @Post(':goalId/operations')
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
