import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { ActiveUserId } from '../../shared/decorators/active-user-id';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@ActiveUserId() userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Patch('me')
  async updateMe(
    @ActiveUserId() userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateName(userId, updateUserDto.name);
  }
}
