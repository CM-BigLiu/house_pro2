import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../entities/store.entity';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private storeRepo: Repository<Store>,
  ) {}

  async findAll(query?: any) {
    const qb = this.storeRepo.createQueryBuilder('s').leftJoinAndSelect('s.city', 'city');
    if (query?.cityId) qb.where('s.cityId = :cityId', { cityId: query.cityId });
    return qb.getMany();
  }
}
