import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUrl, IsUUID } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'URL de redirecionamento após sucesso no checkout',
    example: 'https://app.example.com/subscription/success',
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  successUrl: string;

  @ApiProperty({
    description: 'URL de redirecionamento após cancelamento',
    example: 'https://app.example.com/subscription/cancel',
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  cancelUrl: string;

  @ApiProperty({
    description: 'ID do plano de assinatura',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  planId?: string;
}
