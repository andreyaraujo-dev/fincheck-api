import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';

export class MfaVerifyDto {
  @ApiProperty({
    description:
      'Token temporário retornado no signin quando MFA está habilitado',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  mfaTempToken: string;

  @ApiProperty({
    description: 'Token de 6 dígitos do app autenticador',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Token deve conter apenas 6 dígitos' })
  token: string;

  @ApiProperty({
    description:
      'Confiar no dispositivo por 30 dias - não pedir MFA nas próximas sessões',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  trustDevice?: boolean;

  @ApiProperty({
    description:
      'Fingerprint do dispositivo (obrigatório quando trustDevice=true)',
    example: 'abc123xyz789',
    required: false,
  })
  @ValidateIf((o) => o.trustDevice === true)
  @IsString()
  @IsNotEmpty({ message: 'deviceFingerprint é obrigatório quando trustDevice=true' })
  deviceFingerprint?: string;
}
