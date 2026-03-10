import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class MfaDisableDto {
  @ApiProperty({
    description: 'Senha do usuário para confirmar desabilitação do MFA',
    example: 'senha1234',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
