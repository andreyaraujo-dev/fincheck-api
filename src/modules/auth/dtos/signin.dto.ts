import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SigninDto {
  @ApiProperty({ description: 'E-mail do usuário', example: 'usuario@email.com' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 8 caracteres)',
    example: 'senha1234',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description:
      'Fingerprint do dispositivo para bypass de MFA quando confiável (30 dias)',
    example: 'abc123xyz789',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceFingerprint?: string;
}
