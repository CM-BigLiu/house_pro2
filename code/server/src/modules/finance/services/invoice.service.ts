import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
  ) {}

  async findAll(query: any) {
    const qb = this.invoiceRepo.createQueryBuilder('i');
    if (query.status) qb.where('i.status = :status', { status: query.status });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<Invoice>, user?: CurrentUserPayload) {
    const item = this.invoiceRepo.create({
      ...data,
      creatorId: data.creatorId ?? user?.employeeId,
    });
    return this.invoiceRepo.save(item);
  }

  async update(id: number, data: Partial<Invoice>, user?: CurrentUserPayload) {
    const existing = await this.invoiceRepo.findOne({ where: { id } });
    if (!existing) return null;
    const updated = await this.invoiceRepo.save({ ...existing, ...data, id });
    return updated;
  }
}
