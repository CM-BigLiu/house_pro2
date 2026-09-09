import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceFlow } from '../entities/finance-flow.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class FlowService {
  constructor(
    @InjectRepository(FinanceFlow)
    private flowRepo: Repository<FinanceFlow>,
  ) {}

  private mapFlow(item: FinanceFlow) {
    return {
      ...item,
      title: item.remark || `流水 #${item.id}`,
      type: item.direction,
      amount: Number(item.amount),
      flowDate: item.occurredOn || (item.createdAt instanceof Date ? item.createdAt.toISOString().slice(0, 10) : String(item.createdAt).slice(0, 10)),
      houseTitle: '—',
      customerName: '—',
    };
  }

  private async findScoped(id: number, user: CurrentUserPayload) {
    const qb = this.flowRepo.createQueryBuilder('f').where('f.id = :id', { id });
    applyDataScope(qb, user, 'f', { ownerField: 'creatorId' });
    const flow = await qb.getOne();
    if (!flow) throw new NotFoundException('流水不存在或无权访问');
    return flow;
  }

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.flowRepo.createQueryBuilder('f');
    if (query.type) qb.andWhere('f.direction = :direction', { direction: query.type });
    if (query.keyword?.trim()) qb.andWhere('f.remark ILIKE :keyword', { keyword: `%${query.keyword.trim()}%` });
    if (query.status) qb.andWhere('f.status = :status', { status: query.status });
    if (query.isRed !== undefined) qb.andWhere('f.isRed = :isRed', { isRed: query.isRed });
    applyDataScope(qb, user, 'f', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list: list.map((item) => this.mapFlow(item)), total };
  }

  async create(data: Partial<FinanceFlow>, user: CurrentUserPayload) {
    const storeId = data.storeId ?? user.storeIds?.[0];
    if (!storeId) throw new BadRequestException('当前账号未配置门店');
    const item = this.flowRepo.create({
      ...data,
      status: 'pending',
      audited: false,
      isRed: false,
      storeId,
      creatorId: user.employeeId,
    });
    return this.mapFlow(await this.flowRepo.save(item));
  }

  async findOne(id: number, user: CurrentUserPayload) {
    return this.mapFlow(await this.findScoped(id, user));
  }

  async update(id: number, data: Partial<FinanceFlow>, user: CurrentUserPayload) {
    const existing = await this.findScoped(id, user);
    if (existing.status !== 'pending' || existing.audited || existing.isRed) {
      throw new BadRequestException('仅未审核的待处理流水可编辑');
    }
    const allowed: (keyof FinanceFlow)[] = ['direction', 'amount', 'paymentType', 'bizType', 'remark', 'occurredOn'];
    const changes: Partial<FinanceFlow> = {};
    for (const field of allowed) if (data[field] !== undefined) (changes as any)[field] = data[field];
    await this.flowRepo.save({ ...existing, ...changes, id, creatorId: existing.creatorId });
    return this.findOne(id, user);
  }
}
