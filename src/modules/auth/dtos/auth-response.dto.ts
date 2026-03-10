import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenResponseDto {
  @ApiProperty({ description: 'Token JWT de acesso', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;
}

export class SigninMfaRequiredDto {
  @ApiProperty({ description: 'Indica que MFA é necessário', example: true })
  requiresMfa: true;

  @ApiProperty({
    description: 'Token temporário para enviar no endpoint /auth/mfa/verify',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  mfaTempToken: string;
}
