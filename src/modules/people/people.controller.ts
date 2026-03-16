import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { PersonResponseDto } from './dto/person-response.dto';
import { AccessLogResponseDto } from './dto/access-log-response.dto';
import { ActiveUserId } from '../../shared/decorators/active-user-id';
import { IsPublic } from '../../shared/decorators/is-public';

@ApiTags('People')
@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Criar pessoa e enviar convite (máx 4 ativas)' })
  @ApiResponse({ status: 201, description: 'Pessoa criada e convite enviado', type: PersonResponseDto })
  @ApiResponse({ status: 403, description: 'Assinatura inativa ou plano não permite' })
  @ApiResponse({ status: 409, description: 'E-mail já convidado' })
  create(
    @ActiveUserId() ownerId: string,
    @Body() createPersonDto: CreatePersonDto,
  ) {
    return this.peopleService.create(ownerId, createPersonDto);
  }

  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar pessoas com acesso' })
  @ApiResponse({ status: 200, description: 'Lista de pessoas', type: [PersonResponseDto] })
  findAll(@ActiveUserId() ownerId: string) {
    return this.peopleService.findAll(ownerId);
  }

  @ApiBearerAuth()
  @Get('access-history')
  @ApiOperation({ summary: 'Histórico de acessos' })
  @ApiResponse({ status: 200, description: 'Histórico de acessos', type: [AccessLogResponseDto] })
  getAccessHistory(@ActiveUserId() ownerId: string) {
    return this.peopleService.getAccessHistory(ownerId);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar nível de acesso' })
  @ApiParam({ name: 'id', description: 'ID da pessoa (UUID)' })
  @ApiResponse({ status: 200, description: 'Pessoa atualizada', type: PersonResponseDto })
  @ApiResponse({ status: 404, description: 'Pessoa não encontrada' })
  update(
    @ActiveUserId() ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePersonDto: UpdatePersonDto,
  ) {
    return this.peopleService.update(ownerId, id, updatePersonDto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Remover pessoa' })
  @ApiParam({ name: 'id', description: 'ID da pessoa (UUID)' })
  @ApiResponse({ status: 204, description: 'Pessoa removida' })
  @ApiResponse({ status: 404, description: 'Pessoa não encontrada' })
  remove(
    @ActiveUserId() ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.peopleService.remove(ownerId, id);
  }

  @IsPublic()
  @Get('activate/:token')
  @ApiOperation({ summary: 'Validar token e retornar dados do convite' })
  @ApiParam({ name: 'token', description: 'Token de ativação' })
  @ApiResponse({ status: 200, description: 'Dados do convite (nome, email)' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  validateToken(@Param('token') token: string) {
    return this.peopleService.validateActivationToken(token);
  }

  @IsPublic()
  @Post('activate')
  @ApiOperation({ summary: 'Ativar conta com token + senha' })
  @ApiResponse({ status: 200, description: 'Conta ativada com sucesso' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  activate(@Body() activateAccountDto: ActivateAccountDto) {
    return this.peopleService.activate(activateAccountDto);
  }
}
