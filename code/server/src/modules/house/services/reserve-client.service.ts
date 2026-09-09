import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ReserveClient } from '../entities/reserve-client.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { FollowUp } from '../entities/follow-up.entity';
import { Customer } from '../entities/customer.entity';
import { Employee } from '../../system/entities/employee.entity';

@Injectable()
export class ReserveClientService {
  constructor(
    @InjectRepository(ReserveClient)
    private clientRepo: Repository<ReserveClient>,
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
  ) {}

  private async findScoped(id: number, user: CurrentUserPayload) {
    const qb = this.clientRepo.createQueryBuilder('c').where('c.id = :id', { id });
    applyDataScope(qb, user, 'c', { ownerField: 'creatorId' });
    const item = await qb.getOne();
    if (!item) throw new NotFoundException('储备客源不存在或无权访问');
    return item;
  }

  private async withSalesmanNames(list: ReserveClient[]) {
    const ids = [...new Set(list.map((item) => item.salesmanId).filter(Boolean))];
    const employees = ids.length ? await this.employeeRepo.find({ where: { id: In(ids) } }) : [];
    const names = new Map(employees.map((employee) => [employee.id, employee.name]));
    return list.map((item) => ({ ...item, salesmanName: names.get(item.salesmanId) || '' }));
  }

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.clientRepo.createQueryBuilder('c');
    if (query.demandType) qb.where('c.demandType = :demandType', { demandType: query.demandType });
    if (query.status) qb.andWhere('c.status = :status', { status: query.status });
    if (query.keyword) qb.andWhere('c.clientName LIKE :kw OR c.clientMobile LIKE :kw', { kw: `%${query.keyword}%` });
    applyDataScope(qb, user, 'c', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list: await this.withSalesmanNames(list), total };
  }

  async findOne(id: number, user: CurrentUserPayload) {
    return (await this.withSalesmanNames([await this.findScoped(id, user)]))[0];
  }

  async create(data: Partial<ReserveClient>, user: CurrentUserPayload) {
    const storeId = data.storeId ?? user.storeIds?.[0];
    if (!storeId) throw new BadRequestException('当前账号未配置门店');
    if (user.dataScope !== 'company' && !user.storeIds?.includes(Number(storeId))) {
      throw new ForbiddenException('无权在该门店录入储备客源');
    }
    const item = this.clientRepo.create({
      ...data,
      storeId,
      creatorId: user.employeeId,
      salesmanId: data.salesmanId ?? user.employeeId,
    });
    return this.clientRepo.save(item);
  }

  async update(id: number, data: Partial<ReserveClient>, user: CurrentUserPayload) {
    const existing = await this.findScoped(id, user);
    const allowed: (keyof ReserveClient)[] = [
      'clientName', 'clientMobile', 'desiredLocation', 'demandType', 'desiredLayout',
      'areaMin', 'areaMax', 'priceMin', 'priceMax', 'sourceChannel', 'usage', 'urgency', 'ownership',
    ];
    const changes: Partial<ReserveClient> = {};
    for (const field of allowed) if (data[field] !== undefined) (changes as any)[field] = data[field];
    await this.clientRepo.save({ ...existing, ...changes, id, creatorId: existing.creatorId });
    return this.findOne(id, user);
  }

  async addFollowUp(id: number, data: Partial<FollowUp>, user: CurrentUserPayload) {
    const existing = await this.findScoped(id, user);
    const today = new Date().toISOString().slice(0, 10);
    return this.clientRepo.manager.transaction(async (manager) => {
      const followUp = await manager.getRepository(FollowUp).save(manager.getRepository(FollowUp).create({
        bizType: 'reserve_client',
        bizId: existing.id,
        followType: data.followType,
        content: data.content,
        status: data.status || 'completed',
        employeeId: user.employeeId,
        employeeName: user.name,
      }));
      await manager.getRepository(ReserveClient).update(existing.id, {
        followerId: user.employeeId,
        followDate: today,
      });
      return followUp;
    });
  }

  async convert(id: number, data: { contractCode: string; contractEndDate?: string }, user: CurrentUserPayload) {
    const existing = await this.findScoped(id, user);
    if (existing.status !== 'not_rented' && existing.status !== 'deposit') {
      throw new BadRequestException('仅未租或已定客源可转签约');
    }
    if (!existing.clientMobile) throw new BadRequestException('请先完善客户电话再转签约');
    const contractCode = data.contractCode.trim();
    return this.clientRepo.manager.transaction(async (manager) => {
      const customerRepo = manager.getRepository(Customer);
      if (await customerRepo.exist({ where: { relatedPropertyCode: contractCode } })) {
        throw new BadRequestException('合同编号已存在');
      }
      const customer = await customerRepo.save(customerRepo.create({
        name: existing.clientName,
        mobile: existing.clientMobile,
        customerType: existing.demandType === 'sale' ? 'buyer' : 'tenant',
        sourceChannel: existing.sourceChannel,
        relatedPropertyCode: contractCode,
        contractEndDate: data.contractEndDate,
        status: 'active',
        salesmanId: existing.salesmanId,
        storeId: existing.storeId,
        creatorId: user.employeeId,
        desiredDistrict: existing.desiredLocation,
        budgetMin: existing.priceMin,
        budgetMax: existing.priceMax,
      }));
      const status = existing.demandType === 'sale' ? 'sold' : 'rented';
      await manager.getRepository(ReserveClient).update(existing.id, { status });
      return { reserveClientId: existing.id, customerId: customer.id, contractCode, status };
    });
  }
}
