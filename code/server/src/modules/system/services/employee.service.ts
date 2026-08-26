import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../entities/employee.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
  ) {}

  async findAll(query: any) {
    const qb = this.employeeRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.stores', 'stores')
      .leftJoinAndSelect('e.roles', 'roles');
    if (query.keyword) {
      qb.where('e.name LIKE :kw OR e.mobile LIKE :kw', { kw: `%${query.keyword}%` });
    }
    const [list, total] = await qb
      .skip((query.page - 1 || 0) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<Employee> & { password?: string }) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const employee = this.employeeRepo.create(data);
    return this.employeeRepo.save(employee);
  }

  async update(id: number, data: Partial<Employee>) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const existing = await this.employeeRepo.findOne({ where: { id } });
    if (!existing) return null;
    const updated = await this.employeeRepo.save({ ...existing, ...data, id });
    return updated;
  }
}
