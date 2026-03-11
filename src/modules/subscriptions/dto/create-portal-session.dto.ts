import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreatePortalSessionDto {
  @ApiProperty({
    description: 'URL de retorno após sair do portal de cobrança',
    example: 'https://app.example.com/settings',
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  returnUrl: string;
}
