import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
  ) {}

  async findAll() {
    return this.roleRepo.find({ relations: ['permissions'] });
  }

  async create(data: Partial<Role> & { permissionIds?: number[] }) {
    const { permissionIds, ...rest } = data;
    const role = this.roleRepo.create(rest);
    if (permissionIds?.length) {
      role.permissions = await this.permissionRepo.findByIds(permissionIds);
    }
    return this.roleRepo.save(role);
  }

  async update(id: number, data: Partial<Role> & { permissionIds?: number[] }) {
    const { permissionIds, ...rest } = data;
    await this.roleRepo.update(id, rest);
    const role = await this.roleRepo.findOne({ where: { id }, relations: ['permissions'] });
    if (!role) return null;
    if (permissionIds) {
      role.permissions = permissionIds.length
        ? await this.permissionRepo.findByIds(permissionIds)
        : [];
      await this.roleRepo.save(role);
    }
    return role;
  }
}
