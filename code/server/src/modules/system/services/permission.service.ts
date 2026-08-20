import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
  ) {}

  async findTree() {
    const list = await this.permissionRepo.find({ order: { sort: 'ASC' } });
    return this.buildTree(list);
  }

  private buildTree(list: Permission[], parentId?: number): any[] {
    return list
      .filter((item) => (parentId ? item.parentId === parentId : !item.parentId))
      .map((item) => ({
        ...item,
        children: this.buildTree(list, item.id),
      }));
  }
}
