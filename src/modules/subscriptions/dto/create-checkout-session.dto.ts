import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

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
}
