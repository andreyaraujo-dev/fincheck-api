import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { SharedAccessLevel } from '@prisma/client';

export class CreatePersonDto {
  @ApiProperty({ description: 'Nome da pessoa', example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'E-mail da pessoa', example: 'joao@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Nível de acesso',
    enum: SharedAccessLevel,
    example: SharedAccessLevel.READ_WRITE,
  })
  @IsEnum(SharedAccessLevel)
  accessLevel: SharedAccessLevel;
}
