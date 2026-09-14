import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { RentalService } from './rental.service';
import { SaleService } from './sale.service';
import { ApprovalRecord } from '../../system/entities/approval-record.entity';
import { OperationLog } from '../../system/entities/operation-log.entity';
import { Checkout } from '../entities/checkout.entity';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class PropertyDetailService {
  constructor(private db: DataSource, private rental: RentalService, private sale: SaleService) {}

  async detail(kind: 'rent' | 'sale', id: number, user: CurrentUserPayload, roomId?: number) {
    // 先校验房源的数据范围，再读取流程；不依赖系统审批菜单权限，也不返回日志快照中的敏感字段。
    const property = kind === 'rent' ? await this.rental.findSet(id, user) : await this.sale.findOne(id, user);
    const rooms = kind === 'rent' ? (property as any).rooms || [] : [];
    if (roomId && !rooms.some(room => room.id === roomId)) throw new NotFoundException('房间不存在或不属于该房源');
    const type = kind === 'rent' ? 'rental_set' : 'sale_property';
    const targets = [{ entityType: type, entityId: id }];
    const selectedRooms = roomId ? rooms.filter(room => room.id === roomId) : rooms;
    if (selectedRooms.length) targets.push({ entityType: 'rental_room', entityId: In(selectedRooms.map(room => room.id)) as any });
    const approvals = await this.db.getRepository(ApprovalRecord).find({ where: targets, order: { createdAt: 'DESC' } });
    const checkouts = kind === 'rent' ? await this.db.getRepository(Checkout).find({
      where: { rentalSetId: id, ...(roomId ? { rentalRoomId: roomId } : {}) }, order: { createdAt: 'DESC' },
    }) : [];
    const operations = await this.db.getRepository(OperationLog).find({
      where: { objectType: type, objectId: String(id) }, order: { createdAt: 'DESC' },
      select: ['id', 'action', 'employeeId', 'result', 'createdAt'],
    });
    return { property, roomId: roomId || null, approvals, checkouts, operations };
  }
}
