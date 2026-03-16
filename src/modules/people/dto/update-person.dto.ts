import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SharedAccessLevel } from '@prisma/client';

export class UpdatePersonDto {
  @ApiProperty({
    description: 'Nível de acesso',
    enum: SharedAccessLevel,
    example: SharedAccessLevel.READ_WRITE_RESTRICTED,
  })
  @IsOptional()
  @IsEnum(SharedAccessLevel)
  accessLevel?: SharedAccessLevel;
}
