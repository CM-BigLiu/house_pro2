import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RentalSet } from '../entities/rental-set.entity';
import { RentalRoom } from '../entities/rental-room.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class RentalService {
  constructor(
    @InjectRepository(RentalSet)
    private setRepo: Repository<RentalSet>,
    @InjectRepository(RentalRoom)
    private roomRepo: Repository<RentalRoom>,
  ) {}

  async findSets(query: any, user: CurrentUserPayload) {
    const qb = this.setRepo.createQueryBuilder('rs')
      .leftJoinAndSelect('rs.rooms', 'rooms')
      .leftJoinAndSelect('rs.community', 'community');
    if (query.bizType) qb.where('rs.bizType = :bizType', { bizType: query.bizType });
    if (query.status) qb.andWhere('rs.status = :status', { status: query.status });
    applyDataScope(qb, user, 'rs', { ownerField: 'creatorId', groupField: 'groupId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    const mapped = list.map((rs) => {
      const rooms = rs.rooms || [];
      const rent = rooms.reduce((sum, r) => sum + Number(r.rentPrice || 0), 0);
      const deposit = rooms.reduce((sum, r) => sum + Number(r.depositAmount || 0), 0);
      const roomCount = rooms.length;
      const vacantCount = rooms.filter((r) => r.status === 'vacant').length;
      return {
        ...rs,
        communityName: (rs as any).community?.name || '',
        rent,
        deposit,
        roomCount,
        vacantCount,
      };
    });
    return { list: mapped, total };
  }

  async createSet(data: Partial<RentalSet> & { rooms?: Partial<RentalRoom>[] }) {
    const set = this.setRepo.create(data);
    const saved = await this.setRepo.save(set);
    if (data.rooms?.length) {
      const rooms = data.rooms.map((r) => this.roomRepo.create({ ...r, setId: saved.id }));
      await this.roomRepo.save(rooms);
    }
    return saved;
  }
}
