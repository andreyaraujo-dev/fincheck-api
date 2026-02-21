import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ActiveUserId } from '../../shared/decorators/active-user-id';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Buscar dados do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Retorna nome e e-mail do usuário', type: UserResponseDto })
  async me(@ActiveUserId() userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar nome do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Nome atualizado com sucesso. Retorna nome e e-mail', type: UserResponseDto })
  async updateMe(
    @ActiveUserId() userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateName(userId, updateUserDto.name);
  }
}
