import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token de redefinição de senha recebido por e-mail' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ description: 'Nova senha (mínimo 8 caracteres)', example: 'novaSenha123', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}
