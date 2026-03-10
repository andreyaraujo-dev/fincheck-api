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
import { MfaService } from './services/mfa.service';
import { SigninDto } from './dtos/signin.dto';
import { SignupDto } from './dtos/signup.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { AccessTokenResponseDto } from './dtos/auth-response.dto';
import { IsPublic } from '../../shared/decorators/is-public';
import { ActiveUserId } from '../../shared/decorators/active-user-id';
import { DeleteAccountDto } from './dtos/delete-account.dto';
import { MfaSetupResponseDto } from './dtos/mfa-setup-response.dto';
import { MfaVerifySetupDto } from './dtos/mfa-verify-setup.dto';
import { MfaVerifyDto } from './dtos/mfa-verify.dto';
import { MfaDisableDto } from './dtos/mfa-disable.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mfaService: MfaService,
  ) {}

  @IsPublic()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar usuário' })
  @ApiResponse({
    status: 200,
    description:
      'Retorna { accessToken } ou { requiresMfa: true, mfaTempToken } se MFA habilitado. Com deviceFingerprint de dispositivo confiável, retorna accessToken direto.',
  })
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

  @ApiBearerAuth()
  @Post('mfa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar setup de MFA - retorna QR code' })
  @ApiResponse({
    status: 200,
    description: 'QR code e secret para configurar app autenticador',
    type: MfaSetupResponseDto,
  })
  @ApiResponse({ status: 400, description: 'MFA já habilitado' })
  async mfaSetup(@ActiveUserId() userId: string) {
    return this.mfaService.setupMfa(userId);
  }

  @ApiBearerAuth()
  @Post('mfa/verify-setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar setup de MFA com token do app' })
  @ApiResponse({ status: 200, description: 'MFA habilitado com sucesso' })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  async mfaVerifySetup(
    @ActiveUserId() userId: string,
    @Body() dto: MfaVerifySetupDto,
  ) {
    await this.mfaService.verifySetup(userId, dto.token);
  }

  @IsPublic()
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar token TOTP no login e obter access token' })
  @ApiResponse({
    status: 200,
    description:
      'Retorna o access token JWT. Se trustDevice=true e deviceFingerprint enviados, dispositivo fica confiável por 30 dias.',
    type: AccessTokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  async mfaVerify(@Body() dto: MfaVerifyDto) {
    return this.mfaService.verifyToken(
      dto.mfaTempToken,
      dto.token,
      dto.trustDevice,
      dto.deviceFingerprint,
    );
  }

  @ApiBearerAuth()
  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desabilitar MFA (requer senha)' })
  @ApiResponse({ status: 200, description: 'MFA desabilitado com sucesso' })
  @ApiResponse({ status: 401, description: 'Senha incorreta' })
  async mfaDisable(
    @ActiveUserId() userId: string,
    @Body() dto: MfaDisableDto,
  ) {
    await this.mfaService.disableMfa(userId, dto.password);
  }
}
