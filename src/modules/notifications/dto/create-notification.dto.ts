import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsEmail,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationChannel, NotificationType } from '@prisma/client';

class EmailDataDto {
  @ApiProperty({ description: 'E-mail do destinatário', example: 'usuario@email.com' })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Assunto do e-mail', example: 'Lembrete de pagamento' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'Template do e-mail', example: 'payment-reminder' })
  @IsString()
  @IsNotEmpty()
  template: string;

  @ApiPropertyOptional({ description: 'Variáveis do template', example: { name: 'João', amount: '150.00' } })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}

export class CreateNotificationDto {
  @ApiPropertyOptional({ description: 'ID do usuário destinatário', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ description: 'Tipo da notificação', enum: NotificationType })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({ description: 'Canal de envio', enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  channel: NotificationChannel;

  @ApiProperty({ description: 'Título da notificação', example: 'Pagamento pendente' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Mensagem da notificação', example: 'Você tem um pagamento pendente de R$ 150,00' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais', example: { transactionId: '123' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Dados do e-mail (quando canal for EMAIL)', type: EmailDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailDataDto)
  email?: EmailDataDto;
}
