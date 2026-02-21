import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SigninDto } from './dtos/signin.dto';
import { SignupDto } from './dtos/signup.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { AccessTokenResponseDto } from './dtos/auth-response.dto';
import { IsPublic } from '../../shared/decorators/is-public';
import { ActiveUserId } from '../../shared/decorators/active-user-id';
import { DeleteAccountDto } from './dtos/delete-account.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @IsPublic()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar usuário' })
  @ApiResponse({ status: 200, description: 'Retorna o access token JWT', type: AccessTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async signin(@Body() signinDto: SigninDto) {
    return this.authService.signin(signinDto);
  }

  @IsPublic()
  @Post('signup')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso. Retorna o access token JWT', type: AccessTokenResponseDto })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @IsPublic()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  @ApiResponse({ status: 204, description: 'E-mail de redefinição enviado (se o e-mail existir)' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
  }

  @IsPublic()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Redefinir senha com token' })
  @ApiResponse({ status: 204, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
  }

  @ApiBearerAuth()
  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alterar senha do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 401, description: 'Senha atual incorreta' })
  async updatePassword(
    @ActiveUserId() userId: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    await this.authService.updatePassword(userId, updatePasswordDto);
  }

  @ApiBearerAuth()
  @Delete('account')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir conta do usuário autenticado' })
  @ApiResponse({ status: 204, description: 'Conta excluída com sucesso' })
  @ApiResponse({ status: 401, description: 'Senha incorreta' })
  async deleteAccount(
    @ActiveUserId() userId: string,
    @Body() deleteAccountDto: DeleteAccountDto,
  ) {
    await this.authService.deleteAccount(userId, deleteAccountDto.password);
  }
}
