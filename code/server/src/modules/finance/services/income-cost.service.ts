import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncomeCost } from '../entities/income-cost.entity';
import { cents, money, validMoney } from './business-calculation';
import { applyRecordScope } from '../../../common/data-scope/record-data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class IncomeCostService {
  constructor(
    @InjectRepository(IncomeCost)
    private repo: Repository<IncomeCost>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.repo.createQueryBuilder('ic');
    if (query.period) qb.where('ic.period = :period', { period: query.period });
    applyRecordScope(qb, user, 'ic', 'creatorId');
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list: list.map(row => ({ ...row, ...this.calculate(row) })), total };
  }

  private calculate(data: Partial<IncomeCost>) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(data.period || '')) throw new BadRequestException('月份格式为 YYYY-MM');
    const fields = ['rentIncome', 'depositIncome', 'energyIncome', 'otherIncome', 'rentCost', 'energyCost', 'decorateCost', 'laborCost', 'otherCost'] as const;
    const changes: Partial<IncomeCost> = { period: data.period };
    fields.forEach(field => changes[field] = validMoney(Number(data[field] || 0), field));
    changes.totalIncome = money(fields.slice(0, 4).reduce((sum, field) => sum + cents(changes[field] as number), 0));
    changes.totalCost = money(fields.slice(4).reduce((sum, field) => sum + cents(changes[field] as number), 0));
    return changes;
  }
  async create(data: Partial<IncomeCost>, user: CurrentUserPayload) {
    const storeId = data.storeId || user.storeIds?.[0];
    if (!storeId || (user.dataScope !== 'company' && ![...(user.storeIds || []), ...(user.assignedStoreIds || [])].includes(storeId))) throw new ForbiddenException('无权在该门店登记收支');
    return this.repo.save(this.repo.create({ ...this.calculate(data), storeId, creatorId: user.employeeId }));
  }
  async update(id: number, data: Partial<IncomeCost>, user: CurrentUserPayload) {
    const qb = this.repo.createQueryBuilder('ic').where('ic.id = :id', { id });
    applyRecordScope(qb, user, 'ic', 'creatorId');
    const existing = await qb.getOne();
    if (!existing) throw new NotFoundException('台账不存在或无权修改');
    return this.repo.save({ ...existing, ...this.calculate({ ...existing, ...data }) });
  }
}
