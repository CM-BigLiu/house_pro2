import { Injectable, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Employee } from '../../system/entities/employee.entity';
import { SaleProperty } from '../entities/sale-property.entity';
import { BlacklistService } from './blacklist.service';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { StateMachineService } from '../../../common/services/state-machine.service';
import { SaleStatus } from '../../../common/enums/status.enum';

@Injectable()
export class SaleService {
  private readonly states = new StateMachineService();

  constructor(
    @InjectRepository(SaleProperty) private saleRepo: Repository<SaleProperty>,
    private blacklistService: BlacklistService,
  ) {}

  private require(user: CurrentUserPayload, permission: string) {
    if (!user?.permissions?.some((p) => p === '*' || p === permission)) {
      throw new ForbiddenException('无操作权限');
    }
  }

  private scoped(user: CurrentUserPayload) {
    const qb = this.saleRepo.createQueryBuilder('s').leftJoinAndSelect('s.community', 'community');
    // 售房没有 group_id；按创建员工的分组限定，不能引用不存在的列。
    if (user.dataScope === 'group' && user.groupIds?.length) {
      qb.leftJoin(Employee, 'saleOwner', 'saleOwner.id = s.creatorId')
        .leftJoin('saleOwner.groups', 'saleGroup')
        .andWhere('saleGroup.id IN (:...saleGroupIds)', { saleGroupIds: user.groupIds });
    } else {
      applyDataScope(qb, user, 's', { ownerField: 'creatorId' });
    }
    return qb;
  }

  private map(item: SaleProperty) {
    const numeric = ['salePrice', 'buildingArea', 'interiorArea', 'unitPrice', 'floorPrice', 'debt'] as const;
    const result = { ...item };
    for (const key of numeric) {
      if (result[key] != null) result[key] = Number(result[key]);
    }
    return { ...result, totalPrice: Number(item.salePrice), communityName: item.community?.name || '',
      allowedStatuses: this.states.getAllowedTransitions('sale_property', item.status === 'bargain' ? SaleStatus.PRICE_NEGOTIATION : item.status) };
  }

  async findAll(query: any, user: CurrentUserPayload) {
    this.require(user, 'house:sale');
    const qb = this.scoped(user);
    if (query.keyword?.trim()) {
      qb.andWhere(new Brackets((sub) => {
        for (const field of ['s.title', 's.code', 'community.name', 's.roomNo', 's.ownerName']) {
          sub.orWhere(`${field} ILIKE :kw`, { kw: `%${query.keyword.trim()}%` });
        }
      }));
    }
    if (query.status === SaleStatus.PRICE_NEGOTIATION) {
      qb.andWhere('s.status IN (:...statuses)', { statuses: [SaleStatus.PRICE_NEGOTIATION, 'bargain'] });
    } else if (query.status) {
      qb.andWhere('s.status = :status', { status: query.status });
    }
    const page = Number(query.page || 1), pageSize = Number(query.pageSize || 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 200) {
      throw new BadRequestException('分页参数无效（每页 1–200 条）');
    }
    const [list, total] = await qb.orderBy('s.id', 'DESC').skip((page - 1) * pageSize).take(pageSize).getManyAndCount();
    return { list: list.map((item) => this.map(item)), total };
  }

  async findOne(id: number, user: CurrentUserPayload) {
    this.require(user, 'house:sale');
    const item = await this.scoped(user).andWhere('s.id = :id', { id }).getOne();
    if (!item) throw new ForbiddenException('无权查看或记录不存在');
    return this.map(item);
  }

  private async checkOwner(data: Partial<SaleProperty>) {
    const hits = await this.blacklistService.check(data.ownerPhone, data.ownerIdCard, data.ownerName);
    if (hits.length) throw new BadRequestException('业主信息命中黑名单，请联系有权限的管理员核实');
  }

  async create(data: Partial<SaleProperty>, user: CurrentUserPayload) {
    this.require(user, 'sale:add');
    const storeId = data.storeId ?? user.storeIds?.[0];
    if (!storeId || (user.dataScope !== 'company' && ![...(user.storeIds || []), ...(user.assignedStoreIds || [])].includes(storeId))) {
      throw new ForbiddenException('无权在该门店新增房源');
    }
    await this.checkOwner(data);
    return this.saleRepo.save(this.saleRepo.create({ ...data, storeId, creatorId: user.employeeId, status: SaleStatus.PRE_PUBLISH }));
  }

  async update(id: number, data: Partial<SaleProperty>, user: CurrentUserPayload) {
    this.require(user, 'sale:edit');
    const existing = await this.findOne(id, user);
    for (const key of ['status', 'creatorId', 'storeId', 'code', 'community', 'maintainer', 'createdAt', 'updatedAt', 'id']) {
      if (Object.prototype.hasOwnProperty.call(data, key)) throw new BadRequestException('不可通过编辑接口修改状态、归属或系统字段');
    }
    await this.checkOwner({ ...existing, ...data });
    // 不保存 findOne 的关联对象，避免旧 community 关系覆盖新的 communityId。
    await this.saleRepo.update(id, data);
    return this.findOne(id, user);
  }

  async changeStatus(id: number, status: SaleStatus, user: CurrentUserPayload) {
    this.require(user, 'sale:changeStatus');
    const existing = await this.findOne(id, user);
    const from = existing.status === 'bargain' ? SaleStatus.PRICE_NEGOTIATION : existing.status;
    if (!this.states.canTransition('sale_property', from, status)) throw new BadRequestException('不允许该状态流转');
    const result = await this.saleRepo.update({ id, status: existing.status }, { status });
    if (!result.affected) throw new ConflictException('房源状态已变化，请刷新后重试');
    return this.findOne(id, user);
  }
}
