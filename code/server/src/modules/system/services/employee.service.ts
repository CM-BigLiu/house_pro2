import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Employee } from '../entities/employee.entity';
import * as bcrypt from 'bcrypt';
import { Role } from '../entities/role.entity';
import { Store } from '../entities/store.entity';
import { Position } from '../entities/position.entity';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Store) private storeRepo: Repository<Store>,
    @InjectRepository(Position) private positionRepo: Repository<Position>,
  ) {}

  async findAll(query: any) {
    const qb = this.employeeRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.stores', 'stores')
      .leftJoinAndSelect('e.roles', 'roles')
      .leftJoinAndSelect('e.positions', 'positions');
    if (query.keyword) {
      qb.andWhere('(e.name ILIKE :kw OR e.mobile ILIKE :kw)', { kw: `%${query.keyword}%` });
    }
    if (query.statusFilter) qb.andWhere('e.status = :status', { status: query.statusFilter });
    if (query.storeId) qb.andWhere('stores.id = :storeId', { storeId: Number(query.storeId) });
    if (query.positionId) qb.andWhere('positions.id = :positionId', { positionId: Number(query.positionId) });
    if (query.roleCode) qb.andWhere('roles.code = :roleCode', { roleCode: query.roleCode });
    if (query.managerId) qb.andWhere('e.managerId = :managerId', { managerId: Number(query.managerId) });
    const [list, total] = await qb
      .skip((query.page - 1 || 0) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    const managers = list.some(employee => employee.managerId) ? await this.managerOptions() : [];
    return { list: list.map(employee => ({ ...employee, managerName: managers.find(manager => manager.id === employee.managerId)?.name || '' })), total };
  }

  async findOne(id: number) {
    const employee = await this.employeeRepo.findOne({ where: { id }, relations: ['stores', 'roles', 'positions'] });
    if (!employee) throw new NotFoundException('员工不存在');
    const { password: _password, ...safe } = employee;
    return safe;
  }

  async managerOptions() {
    const managers = await this.employeeRepo.createQueryBuilder('manager').innerJoin('manager.roles', 'role', 'role.code = :code', { code: 'store_manager' }).leftJoinAndSelect('manager.stores', 'stores').where('manager.status = :status', { status: 'normal' }).orderBy('manager.id', 'ASC').getMany();
    return managers.map(manager => ({ id: manager.id, name: manager.name, storeIds: (manager.stores || []).map(store => store.id) }));
  }

  private async validateManager(employee: Partial<Employee>) {
    if (employee.managerId == null) return;
    if (!Number.isInteger(employee.managerId) || employee.managerId <= 0 || employee.managerId === employee.id) throw new BadRequestException('请选择有效的归属店长');
    if (!(employee.roles || []).some(role => ['salesman', 'agent'].includes(role.code))) throw new BadRequestException('归属店长适用于业务员或综合经纪人');
    const manager = (await this.managerOptions()).find(manager => manager.id === employee.managerId);
    if (!manager || !manager.storeIds.some(id => (employee.stores || []).some(store => store.id === id))) throw new BadRequestException('归属店长须为同一门店的在职店长');
  }

  async create(data: Partial<Employee> & { password?: string; roleIds?: number[]; storeIds?: number[]; positionIds?: number[] }) {
    const { roleIds, storeIds, positionIds, ...fields } = data;
    if (!fields.password) throw new BadRequestException('请设置初始密码');
    fields.password = await bcrypt.hash(fields.password, 10);
    const employee = this.employeeRepo.create({
      ...fields,
      roles: roleIds?.length ? await this.roleRepo.find({ where: { id: In(roleIds) } }) : [],
      stores: storeIds?.length ? await this.storeRepo.find({ where: { id: In(storeIds) } }) : [],
      positions: positionIds?.length ? await this.positionRepo.find({ where: { id: In(positionIds) } }) : [],
    });
    await this.validateManager(employee);
    return this.employeeRepo.save(employee);
  }

  async update(id: number, data: Partial<Employee> & { roleIds?: number[]; storeIds?: number[]; positionIds?: number[] }) {
    const { roleIds, storeIds, positionIds, ...fields } = data;
    const existing = await this.employeeRepo.findOne({ where: { id }, relations: ['roles', 'stores', 'positions'] });
    if (!existing) throw new NotFoundException('员工不存在');
    if (fields.password) fields.password = await bcrypt.hash(fields.password, 10);
    else delete fields.password;
    const employee = {
      ...existing,
      ...fields,
      id,
      roles: roleIds === undefined ? existing.roles : roleIds.length ? await this.roleRepo.find({ where: { id: In(roleIds) } }) : [],
      stores: storeIds === undefined ? existing.stores : storeIds.length ? await this.storeRepo.find({ where: { id: In(storeIds) } }) : [],
      positions: positionIds === undefined ? existing.positions : positionIds.length ? await this.positionRepo.find({ where: { id: In(positionIds) } }) : [],
    };
    await this.validateManager(employee);
    const updated = await this.employeeRepo.save(employee);
    const { password: _password, ...safe } = updated;
    return safe;
  }
}
