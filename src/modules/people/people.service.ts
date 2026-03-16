import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { PrismaService } from '../../shared/database/prisma.service';
import { SharedPersonsRepository } from '../../shared/database/repositories/shared-persons.repository';
import { SharedInvitesRepository } from '../../shared/database/repositories/shared-invites.repository';
import { SharedAccessLogsRepository } from '../../shared/database/repositories/shared-access-logs.repository';
import { SubscriptionsRepository } from '../../shared/database/repositories/subscriptions.repository';
import { UsersRepository } from '../../shared/database/repositories/users.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { ConstantKeys } from '../../shared/config/constant-keys';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';

@Injectable()
export class PeopleService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sharedPersonsRepository: SharedPersonsRepository,
    private readonly sharedInvitesRepository: SharedInvitesRepository,
    private readonly sharedAccessLogsRepository: SharedAccessLogsRepository,
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly notificationsService: NotificationsService,
    @Inject(ConstantKeys.appUrl)
    private readonly appUrl: string,
  ) {}

  private readonly MAX_PEOPLE = 4;
  private readonly INVITE_EXPIRY_DAYS = 7;

  private async ensureCanInvite(ownerId: string): Promise<void> {
    const subscription = await this.subscriptionsRepository.findFirst({
      where: { userId: ownerId, isActive: true },
    });

    if (!subscription) {
      throw new ForbiddenException(
        'Assinatura inativa ou inexistente. Assine para convidar pessoas.',
      );
    }

    const now = new Date();
    const trialExpired =
      subscription.isTrial &&
      subscription.trialEndsAt &&
      subscription.trialEndsAt < now;
    if (trialExpired) {
      throw new ForbiddenException(
        'Período de trial encerrado. Assine para convidar pessoas.',
      );
    }

    const plan = (subscription as { plan?: string }).plan;
    if (plan && plan !== 'BASIC' && plan !== 'PREMIUM') {
      throw new ForbiddenException(
        'Seu plano não permite convidar pessoas. Faça upgrade para Basic ou Premium.',
      );
    }
    // plan undefined or BASIC/PREMIUM: allow
  }

  async create(ownerId: string, dto: CreatePersonDto) {
    await this.ensureCanInvite(ownerId);

    const count = await this.sharedPersonsRepository.count({
      where: {
        ownerId,
        status: { in: ['PENDING', 'ACTIVE'] },
      },
    });

    if (count >= this.MAX_PEOPLE) {
      throw new BadRequestException(
        `Você pode convidar no máximo ${this.MAX_PEOPLE} pessoas.`,
      );
    }

    const existing = await this.sharedPersonsRepository.findFirst({
      where: { ownerId, email: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        'Este e-mail já foi convidado para acessar sua conta.',
      );
    }

    const sharedPerson = await this.sharedPersonsRepository.create({
      data: {
        ownerId,
        name: dto.name,
        email: dto.email,
        accessLevel: dto.accessLevel,
        status: 'PENDING',
      },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.INVITE_EXPIRY_DAYS);

    await this.sharedInvitesRepository.create({
      data: {
        sharedPersonId: sharedPerson.id,
        token,
        expiresAt,
      },
    });

    await this.sharedAccessLogsRepository.create({
      data: {
        sharedPersonId: sharedPerson.id,
        ownerId,
        accessLevel: dto.accessLevel,
        action: 'CREATED',
        description: `${dto.name} convidado para acessar a conta`,
      },
    });

    const activationLink = `${this.appUrl}/activate-account?token=${token}`;

    const owner = await this.usersRepository.findUnique({
      where: { id: ownerId },
      select: { name: true },
    });

    this.notificationsService.notify({
      type: 'GENERAL',
      channel: 'EMAIL',
      title: 'Convite para acessar conta myCash',
      message: 'Você foi convidado para acessar uma conta no myCash.',
      email: {
        to: dto.email,
        subject: 'Convite para acessar conta — myCash',
        template: 'account-activation',
        variables: {
          name: dto.name,
          activationLink,
          ownerName: owner?.name ?? '',
        },
      },
    });

    return sharedPerson;
  }

  async findAll(ownerId: string) {
    return this.sharedPersonsRepository.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(ownerId: string, id: string) {
    const person = await this.sharedPersonsRepository.findFirst({
      where: { id, ownerId },
    });

    if (!person) {
      throw new NotFoundException('Pessoa não encontrada.');
    }

    return person;
  }

  async update(ownerId: string, id: string, dto: UpdatePersonDto) {
    const person = await this.findOne(ownerId, id);

    if (person.status !== 'ACTIVE' && person.status !== 'PENDING') {
      throw new BadRequestException('Não é possível editar pessoa removida.');
    }

    if (!dto.accessLevel) {
      return person;
    }

    const previousLevel = person.accessLevel;
    const updated = await this.sharedPersonsRepository.update({
      where: { id },
      data: { accessLevel: dto.accessLevel },
    });

    const levelLabels: Record<string, string> = {
      READ_ONLY: 'Leitura',
      READ_WRITE: 'Leitura e escrita',
      READ_WRITE_RESTRICTED: 'Leitura e escrita com restrições',
    };
    const description = `Nível de acesso alterado de ${levelLabels[previousLevel] ?? previousLevel} para ${levelLabels[dto.accessLevel] ?? dto.accessLevel}`;

    await this.sharedAccessLogsRepository.create({
      data: {
        sharedPersonId: person.id,
        ownerId,
        accessLevel: dto.accessLevel,
        action: 'UPDATED',
        description,
      },
    });

    return updated;
  }

  async remove(ownerId: string, id: string) {
    const person = await this.findOne(ownerId, id);

    await this.sharedPersonsRepository.update({
      where: { id },
      data: { status: 'REMOVED', userId: null },
    });

    await this.sharedAccessLogsRepository.create({
      data: {
        sharedPersonId: person.id,
        ownerId,
        accessLevel: person.accessLevel,
        action: 'REMOVED',
        description: `${person.name} removido da conta`,
      },
    });

    await this.sharedInvitesRepository.deleteMany({
      where: { sharedPersonId: id },
    });
  }

  async getAccessHistory(ownerId: string) {
    return this.sharedAccessLogsRepository.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        sharedPerson: {
          select: { name: true, email: true },
        },
      },
    });
  }

  async validateActivationToken(token: string) {
    const invite = await this.prismaService.sharedInvite.findFirst({
      where: { token },
      include: { sharedPerson: true },
    });

    if (!invite) {
      throw new UnauthorizedException('Token inválido.');
    }

    if (invite.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Token expirado. Solicite um novo convite.',
      );
    }

    if (invite.sharedPerson.status === 'REMOVED') {
      throw new UnauthorizedException('Este convite não é mais válido.');
    }

    return {
      name: invite.sharedPerson.name,
      email: invite.sharedPerson.email,
    };
  }

  async activate(dto: ActivateAccountDto) {
    const invite = await this.prismaService.sharedInvite.findFirst({
      where: { token: dto.token },
      include: { sharedPerson: true },
    });

    if (!invite) {
      throw new UnauthorizedException('Token inválido.');
    }

    if (invite.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Token expirado. Solicite um novo convite.',
      );
    }

    const sharedPerson = invite.sharedPerson;

    if (sharedPerson.status === 'REMOVED') {
      throw new UnauthorizedException('Este convite não é mais válido.');
    }

    let user = await this.usersRepository.findUnique({
      where: { email: sharedPerson.email },
    });

    if (!user) {
      const hashedPassword = await hash(dto.newPassword, 12);
      user = await this.usersRepository.create({
        data: {
          name: sharedPerson.name,
          email: sharedPerson.email,
          password: hashedPassword,
        },
      });
    } else {
      const hashedPassword = await hash(dto.newPassword, 12);
      await this.usersRepository.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    }

    await this.sharedPersonsRepository.update({
      where: { id: sharedPerson.id },
      data: { userId: user.id, status: 'ACTIVE' },
    });

    await this.sharedInvitesRepository.delete({
      where: { id: invite.id },
    });

    await this.sharedAccessLogsRepository.create({
      data: {
        sharedPersonId: sharedPerson.id,
        ownerId: sharedPerson.ownerId,
        accessLevel: sharedPerson.accessLevel,
        action: 'ACTIVATED',
        description: 'Conta ativada com sucesso',
      },
    });

    // Email de boas-vindas para o convidado
    this.notificationsService.notify({
      type: 'WELCOME',
      channel: 'EMAIL',
      title: 'Bem-vindo ao myCash!',
      message: 'Sua conta foi ativada com sucesso.',
      email: {
        to: sharedPerson.email,
        subject: 'Bem-vindo ao myCash — Conta ativada',
        template: 'invite-welcome',
        variables: { name: sharedPerson.name },
      },
    });

    // Notificação no app para o owner: convite aceito pelo convidado
    this.notificationsService.notify({
      userId: sharedPerson.ownerId,
      type: 'GENERAL',
      channel: 'IN_APP',
      title: 'Convite aceito',
      message: `${sharedPerson.name} aceitou seu convite e já pode acessar a conta.`,
    });

    return { message: 'Conta ativada com sucesso. Faça login para acessar.' };
  }
}
