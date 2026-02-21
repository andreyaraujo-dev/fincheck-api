import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'E-mail da conta para recuperação de senha', example: 'usuario@email.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
