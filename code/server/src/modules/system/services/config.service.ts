import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Config } from '../entities/config.entity';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(Config)
    private configRepo: Repository<Config>,
  ) {}

  async findByGroup(group?: string) {
    const qb = this.configRepo.createQueryBuilder('c');
    if (group) qb.where('c.group = :group', { group });
    return qb.orderBy('c.sort', 'ASC').addOrderBy('c.id', 'ASC').getMany();
  }

  async batchUpdate(configs: { id?: number; configKey?: string; configValue?: string }[]) {
    const results: Config[] = [];
    for (const item of configs || []) {
      if (item.id) {
        await this.configRepo.update(item.id, { configValue: item.configValue });
        const updated = await this.configRepo.findOne({ where: { id: item.id } });
        if (updated) results.push(updated);
      } else if (item.configKey) {
        const existing = await this.configRepo.findOne({ where: { configKey: item.configKey } });
        if (existing) {
          await this.configRepo.update(existing.id, { configValue: item.configValue });
          results.push({ ...existing, configValue: item.configValue });
        }
      }
    }
    return results;
  }
}
