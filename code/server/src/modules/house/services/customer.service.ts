import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.customerRepo.createQueryBuilder('c');
    if (query.customerType) qb.where('c.customerType = :customerType', { customerType: query.customerType });
    if (query.keyword) qb.andWhere('c.name LIKE :kw OR c.mobile LIKE :kw', { kw: `%${query.keyword}%` });
    applyDataScope(qb, user, 'c', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<Customer>) {
    const item = this.customerRepo.create(data);
    return this.customerRepo.save(item);
  }
}
