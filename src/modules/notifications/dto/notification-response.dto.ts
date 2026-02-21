import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationItemDto {
  @ApiProperty({ description: 'ID da notificação', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiPropertyOptional({ description: 'ID do usuário', example: '550e8400-e29b-41d4-a716-446655440001' })
  userId?: string;

  @ApiProperty({ description: 'Tipo da notificação', example: 'PAYMENT_REMINDER' })
  type: string;

  @ApiProperty({ description: 'Canal de envio', example: 'IN_APP' })
  channel: string;

  @ApiProperty({ description: 'Título', example: 'Pagamento pendente' })
  title: string;

  @ApiProperty({ description: 'Mensagem', example: 'Você tem um pagamento pendente de R$ 150,00' })
  message: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais', example: { transactionId: '123' } })
  metadata?: Record<string, unknown>;

  @ApiProperty({ example: '2026-02-20T14:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Se a notificação foi lida', example: false })
  read: boolean;

  @ApiPropertyOptional({ description: 'Data de leitura', example: '2026-02-20T15:00:00.000Z' })
  readAt?: string;
}

class PaginationMetaDto {
  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Total de páginas', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Total de registros', example: 47 })
  total: number;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationItemDto] })
  data: NotificationItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class UnreadCountResponseDto {
  @ApiProperty({ description: 'Quantidade de notificações não lidas', example: 3 })
  count: number;
}

export class MarkAllReadResponseDto {
  @ApiProperty({ description: 'Quantidade de notificações marcadas como lidas', example: 5 })
  marked: number;
}
