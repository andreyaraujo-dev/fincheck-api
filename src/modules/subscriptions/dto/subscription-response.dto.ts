import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan } from '@prisma/client';

export class SubscriptionResponseDto {
  @ApiProperty({
    description: 'ID da assinatura',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @ApiProperty({
    description: 'Plano da assinatura (BASIC ou PREMIUM)',
    enum: SubscriptionPlan,
    example: 'BASIC',
  })
  plan: SubscriptionPlan;

  @ApiProperty({ description: 'Se a assinatura está ativa', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Se é período de trial', example: false })
  isTrial: boolean;

  @ApiPropertyOptional({
    description: 'Data de fim do trial',
    example: '2026-03-20T00:00:00.000Z',
  })
  trialEndsAt?: string;

  @ApiPropertyOptional({
    description: 'Data de solicitação de cancelamento',
    example: null,
  })
  cancelRequestedAt?: string;

  @ApiProperty({ description: 'Valor da assinatura', example: 29.9 })
  value: number;

  @ApiProperty({
    description: 'Data de início',
    example: '2026-02-20T00:00:00.000Z',
  })
  startDate: string;

  @ApiProperty({
    description: 'Próxima data de renovação',
    example: '2026-03-20T00:00:00.000Z',
  })
  nextRenewalAt: string;

  @ApiPropertyOptional({ description: 'Data de reativação', example: null })
  reactivatedAt?: string;

  @ApiProperty({ example: '2026-02-20T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-02-20T10:00:00.000Z' })
  updatedAt: string;
}
