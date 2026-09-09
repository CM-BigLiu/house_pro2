import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { Employee } from '../../system/entities/employee.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
  ) {}

  private async findScoped(id: number, user: CurrentUserPayload) {
    const qb = this.customerRepo.createQueryBuilder('c').where('c.id = :id', { id });
    applyDataScope(qb, user, 'c', { ownerField: 'creatorId' });
    const item = await qb.getOne();
    if (!item) throw new NotFoundException('客户不存在或无权访问');
    return item;
  }

  private async mapList(list: Customer[]) {
    const employeeIds = [...new Set(list.map((item) => item.salesmanId).filter(Boolean))];
    const employees = employeeIds.length ? await this.employeeRepo.find({ where: { id: In(employeeIds) } }) : [];
    const names = new Map(employees.map((employee) => [employee.id, employee.name]));
    return list.map((item) => ({
      ...item,
      budgetMin: item.budgetMin == null ? null : Number(item.budgetMin),
      budgetMax: item.budgetMax == null ? null : Number(item.budgetMax),
      employeeName: names.get(item.salesmanId) || '',
    }));
  }

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.customerRepo.createQueryBuilder('c');
    if (query.customerType) qb.andWhere('c.customerType = :customerType', { customerType: query.customerType });
    if (query.status) qb.andWhere('c.status = :status', { status: query.status });
    if (query.desiredDistrict?.trim()) qb.andWhere('c.desiredDistrict ILIKE :district', { district: `%${query.desiredDistrict.trim()}%` });
    const budgetMin = query.budgetMin === '' || query.budgetMin == null ? undefined : Number(query.budgetMin);
    const budgetMax = query.budgetMax === '' || query.budgetMax == null ? undefined : Number(query.budgetMax);
    if (budgetMin !== undefined && (!Number.isFinite(budgetMin) || budgetMin < 0)) throw new BadRequestException('最低预算无效');
    if (budgetMax !== undefined && (!Number.isFinite(budgetMax) || budgetMax < 0)) throw new BadRequestException('最高预算无效');
    if (budgetMin !== undefined && budgetMax !== undefined && budgetMin > budgetMax) throw new BadRequestException('最低预算不能高于最高预算');
    if (budgetMin !== undefined) qb.andWhere('(c.budgetMax IS NULL OR c.budgetMax >= :budgetMin)', { budgetMin });
    if (budgetMax !== undefined) qb.andWhere('(c.budgetMin IS NULL OR c.budgetMin <= :budgetMax)', { budgetMax });
    if (query.keyword?.trim()) qb.andWhere(new Brackets((sub) => {
      sub.where('c.name ILIKE :kw', { kw: `%${query.keyword.trim()}%` })
        .orWhere('c.mobile ILIKE :kw', { kw: `%${query.keyword.trim()}%` })
        .orWhere('c.relatedPropertyCode ILIKE :kw', { kw: `%${query.keyword.trim()}%` });
    }));
    applyDataScope(qb, user, 'c', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list: await this.mapList(list), total };
  }

  async findOne(id: number, user: CurrentUserPayload) {
    return (await this.mapList([await this.findScoped(id, user)]))[0];
  }

  async create(data: Partial<Customer>, user?: CurrentUserPayload) {
    const item = this.customerRepo.create({
      ...data,
      storeId: data.storeId ?? user?.storeIds?.[0],
      creatorId: data.creatorId ?? user?.employeeId,
    });
    return this.customerRepo.save(item);
  }

  async update(id: number, data: Partial<Customer>, user: CurrentUserPayload) {
    const existing = await this.findScoped(id, user);
    const allowed: (keyof Customer)[] = [
      'name', 'mobile', 'idCard', 'customerType', 'sourceChannel', 'relatedPropertyCode',
      'contractEndDate', 'salesmanId', 'isBlacklist', 'desiredDistrict', 'budgetMin',
      'budgetMax', 'remark', 'status',
    ];
    const changes: Partial<Customer> = {};
    for (const field of allowed) if (data[field] !== undefined) (changes as any)[field] = data[field];
    await this.customerRepo.save({ ...existing, ...changes, id, creatorId: existing.creatorId });
    return this.findOne(id, user);
  }
}
