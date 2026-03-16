import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SharedAccessLevel } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ description: 'Nome do usuário', example: 'João Silva' })
  name: string;

  @ApiProperty({ description: 'E-mail do usuário', example: 'joao@email.com' })
  email: string;

  @ApiProperty({
    description: 'Indica se MFA está habilitado para o usuário',
    example: false,
  })
  isMfaEnabled: boolean;

  @ApiPropertyOptional({
    description: 'Nível de acesso compartilhado (presente apenas para usuários com acesso compartilhado)',
    enum: SharedAccessLevel,
  })
  sharedAccessLevel?: SharedAccessLevel;

  @ApiProperty({
    description: 'Indica se o usuário é o dono da conta',
    example: true,
  })
  isAccountOwner: boolean;
}
