import { Injectable, NotFoundException } from '@nestjs/common';
import { PlansRepository } from '../../shared/database/repositories/plans.repository';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from '@prisma/client';

@Injectable()
export class PlansService {
  constructor(private readonly plansRepository: PlansRepository) {}

  async findAll() {
    const plans = await this.plansRepository.findMany({
      orderBy: { name: 'asc' },
    });
    return plans.map(this.toPlanResponse);
  }

  async findOne(id: string) {
    const plan = await this.plansRepository.findUnique({
      where: { id },
    });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado.');
    }
    return this.toPlanResponse(plan);
  }

  async create(dto: CreatePlanDto) {
    const plan = await this.plansRepository.create({
      data: {
        name: dto.name,
        description: dto.description,
        benefits: Array.isArray(dto.benefits) ? dto.benefits.join(', ') : '',
        price: dto.price,
        isActive: dto.isActive ?? true,
      },
    });
    return this.toPlanResponse(plan);
  }

  async update(id: string, dto: UpdatePlanDto) {
    const plan = await this.plansRepository.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado.');
    }
    const updated = await this.plansRepository.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.benefits !== undefined && {
          benefits: Array.isArray(dto.benefits) ? dto.benefits.join(', ') : '',
        }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return this.toPlanResponse(updated);
  }

  async delete(id: string) {
    const plan = await this.plansRepository.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado.');
    }
    const deleted = await this.plansRepository.delete({ where: { id } });
    return this.toPlanResponse(deleted);
  }

  private toPlanResponse(plan: Plan) {
    const benefits = plan.benefits
      ? plan.benefits
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean)
      : [];
    return { ...plan, benefits };
  }
}
