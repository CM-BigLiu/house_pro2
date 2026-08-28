import { Injectable } from '@nestjs/common';
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
      .leftJoinAndSelect('s.manager', 'manager');
    if (query?.cityId) qb.where('s.cityId = :cityId', { cityId: query.cityId });
    return qb.getMany();
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
    if (typeof manager === 'string' && manager.trim()) {
      const employee = await this.employeeRepo
        .createQueryBuilder('e')
        .where('e.name = :name', { name: manager.trim() })
        .getOne();
      if (employee) rest.managerId = employee.id;
    }
    await this.storeRepo.update(id, rest);
    return this.storeRepo.findOne({ where: { id } });
  }

  async remove(id: number) {
    await this.storeRepo.delete(id);
  }
}
