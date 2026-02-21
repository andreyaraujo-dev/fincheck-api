import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { ActiveUserId } from '../../shared/decorators/active-user-id';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova assinatura' })
  @ApiResponse({ status: 201, description: 'Assinatura criada com sucesso', type: SubscriptionResponseDto })
  @ApiResponse({ status: 409, description: 'Já existe uma assinatura ativa' })
  subscribe(
    @ActiveUserId() userId: string,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.subscribe(userId, createSubscriptionDto);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar a assinatura ativa' })
  @ApiResponse({ status: 200, description: 'Assinatura cancelada com sucesso', type: SubscriptionResponseDto })
  @ApiResponse({ status: 404, description: 'Nenhuma assinatura ativa encontrada' })
  cancel(@ActiveUserId() userId: string) {
    return this.subscriptionsService.cancel(userId);
  }

  @Post('renew')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar ou reativar a assinatura' })
  @ApiResponse({ status: 200, description: 'Assinatura renovada com sucesso', type: SubscriptionResponseDto })
  @ApiResponse({ status: 404, description: 'Nenhuma assinatura encontrada' })
  renew(@ActiveUserId() userId: string) {
    return this.subscriptionsService.renew(userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Buscar assinatura do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Dados da assinatura', type: SubscriptionResponseDto })
  @ApiResponse({ status: 404, description: 'Nenhuma assinatura encontrada' })
  getSubscription(@ActiveUserId() userId: string) {
    return this.subscriptionsService.getSubscription(userId);
  }
}
