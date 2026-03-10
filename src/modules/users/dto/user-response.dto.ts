import { ApiProperty } from '@nestjs/swagger';

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
}
