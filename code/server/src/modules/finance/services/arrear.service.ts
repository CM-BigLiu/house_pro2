import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Arrear } from '../entities/arrear.entity';

@Injectable()
export class ArrearService {
  constructor(
    @InjectRepository(Arrear)
    private arrearRepo: Repository<Arrear>,
  ) {}

  async findAll(query: any) {
    const qb = this.arrearRepo.createQueryBuilder('a');
    if (query.status) qb.where('a.status = :status', { status: query.status });
    if (query.personType) qb.andWhere('a.personType = :personType', { personType: query.personType });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<Arrear>) {
    const item = this.arrearRepo.create(data);
    return this.arrearRepo.save(item);
  }
}
