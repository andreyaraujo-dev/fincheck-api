import { ApiProperty } from '@nestjs/swagger';
import { SharedAccessLevel } from '@prisma/client';

export class AccessLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sharedPersonId: string;

  @ApiProperty()
  ownerId: string;

  @ApiProperty({ enum: SharedAccessLevel })
  accessLevel: SharedAccessLevel;

  @ApiProperty({ example: 'CREATED' })
  action: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  createdAt: Date;
}
