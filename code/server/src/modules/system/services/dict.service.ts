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

  async findItems(dictCode: string) {
    return this.itemRepo.find({
      where: { dictCode, enabled: true },
      order: { sort: 'ASC' },
    });
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
