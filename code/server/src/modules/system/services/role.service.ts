import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}

  async findAll() {
    return this.roleRepo.find({ relations: ['permissions'] });
  }

  async create(data: Partial<Role>) {
    const role = this.roleRepo.create(data);
    return this.roleRepo.save(role);
  }

  async update(id: number, data: Partial<Role>) {
    await this.roleRepo.update(id, data);
    return this.roleRepo.findOne({ where: { id }, relations: ['permissions'] });
  }
}
