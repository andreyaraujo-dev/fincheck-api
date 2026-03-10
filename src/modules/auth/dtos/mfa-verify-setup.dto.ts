import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class MfaVerifySetupDto {
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
}
