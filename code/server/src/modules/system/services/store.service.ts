import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../entities/store.entity';
import { Employee } from '../entities/employee.entity';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private storeRepo: Repository<Store>,
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
  ) {}

  async findAll(query?: any) {
    const qb = this.storeRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.city', 'city')
      .leftJoinAndSelect('s.manager', 'manager')
      .loadRelationCountAndMap('s.employeeCount', 's.employees');
    if (query?.cityId) qb.andWhere('s.cityId = :cityId', { cityId: Number(query.cityId) });
    if (query?.status) qb.andWhere('s.status = :status', { status: query.status });
    if (query?.keyword?.trim()) qb.andWhere('(s.name ILIKE :keyword OR s.address ILIKE :keyword OR s.phone ILIKE :keyword)', { keyword: `%${query.keyword.trim()}%` });
    const list = await qb.orderBy('s.id', 'ASC').getMany();
    return list.map((store: Store & { employeeCount?: number }) => ({
      ...store,
      cityName: store.city?.name || '',
      employeeCount: Number(store.employeeCount || 0),
    }));
  }

  async findOne(id: number) {
    const store = await this.storeRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.city', 'city')
      .leftJoinAndSelect('s.manager', 'manager')
      .loadRelationCountAndMap('s.employeeCount', 's.employees')
      .where('s.id = :id', { id })
      .getOne();
    if (!store) throw new NotFoundException('门店不存在');
    return { ...store, cityName: store.city?.name || '', employeeCount: Number((store as any).employeeCount || 0) };
  }

  async create(data: any) {
    const { manager, ...rest } = data || {};
    let managerId = rest.managerId ?? null;
    // 前端「店长」为文本输入，按姓名匹配员工后转为 managerId 关联
    if (!managerId && typeof manager === 'string' && manager.trim()) {
      const employee = await this.employeeRepo
        .createQueryBuilder('e')
        .where('e.name = :name', { name: manager.trim() })
        .getOne();
      managerId = employee?.id ?? null;
    }
    const item = this.storeRepo.create({
      ...rest,
      managerId,
      status: rest.status || 'active',
    });
    return this.storeRepo.save(item);
  }

  async update(id: number, data: any) {
    const { manager, ...rest } = data || {};
    if (typeof manager === 'string') {
      if (manager.trim()) {
        const employee = await this.employeeRepo.createQueryBuilder('e').where('e.name = :name', { name: manager.trim() }).getOne();
        rest.managerId = employee?.id ?? null;
      } else {
        rest.managerId = null;
      }
    }
    await this.storeRepo.update(id, rest);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.storeRepo.delete(id);
  }
}
