import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Dict } from '../entities/dict.entity';
import { DictItem } from '../entities/dict-item.entity';

@Injectable()
export class DictService {
  constructor(
    @InjectRepository(Dict)
    private dictRepo: Repository<Dict>,
    @InjectRepository(DictItem)
    private itemRepo: Repository<DictItem>,
  ) {}

  async findAll() {
    return this.dictRepo.find({ order: { code: 'ASC' } });
  }

  async findItems(dictCode: string, tree = false) {
    const items = await this.itemRepo.find({
      where: { dictCode, enabled: true },
      order: { sort: 'ASC' },
    });
    if (!tree) return items;
    return this.buildTree(items);
  }

  private buildTree(items: DictItem[]): any[] {
    const roots: any[] = [];
    const map = new Map<string, any>();
    for (const item of items) {
      const node = { ...item, children: [] };
      map.set(item.value, node);
    }
    for (const item of items) {
      const node = map.get(item.value);
      if (!node) continue;
      if (item.parentValue && map.has(item.parentValue)) {
        const parent = map.get(item.parentValue);
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  async createItem(data: Partial<DictItem>) {
    const item = this.itemRepo.create(data);
    return this.itemRepo.save(item);
  }

  async updateItem(id: number, data: Partial<DictItem>) {
    await this.itemRepo.update(id, data);
    return this.itemRepo.findOne({ where: { id } });
  }

  async removeItem(id: number) {
    await this.itemRepo.delete(id);
  }
}
