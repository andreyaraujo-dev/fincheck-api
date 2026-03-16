import { ApiProperty } from '@nestjs/swagger';
import { SharedAccessLevel } from '@prisma/client';

export class PersonResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: SharedAccessLevel })
  accessLevel: SharedAccessLevel;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
