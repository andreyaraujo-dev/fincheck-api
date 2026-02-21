import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { ActiveUserId } from '../../shared/decorators/active-user-id';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationListResponseDto, UnreadCountResponseDto, MarkAllReadResponseDto } from './dto/notification-response.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar uma notificação' })
  @ApiResponse({ status: 201, description: 'Notificação criada e enviada' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.notify(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário com paginação' })
  @ApiResponse({ status: 200, description: 'Lista paginada de notificações com status de leitura', type: NotificationListResponseDto })
  findAll(
    @ActiveUserId() userId: string,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.findAll(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Obter quantidade de notificações não lidas' })
  @ApiResponse({ status: 200, description: 'Quantidade de notificações não lidas', type: UnreadCountResponseDto })
  async getUnreadCount(@ActiveUserId() userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar uma notificação como lida' })
  @ApiParam({ name: 'id', description: 'ID da notificação (UUID)' })
  @ApiResponse({ status: 200, description: 'Notificação marcada como lida' })
  markAsRead(
    @Param('id', ParseUUIDPipe) notificationId: string,
    @ActiveUserId() userId: string,
  ) {
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  @ApiResponse({ status: 200, description: 'Total de notificações marcadas como lidas', type: MarkAllReadResponseDto })
  markAllAsRead(@ActiveUserId() userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
