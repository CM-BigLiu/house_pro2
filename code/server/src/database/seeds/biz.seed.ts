import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from '../../modules/house/entities/community.entity';
import { Building, Unit, Floor, RoomCode } from '../../modules/house/entities/community-hierarchy.entity';
import { SaleProperty } from '../../modules/house/entities/sale-property.entity';
import { RentalSet } from '../../modules/house/entities/rental-set.entity';
import { RentalRoom } from '../../modules/house/entities/rental-room.entity';
import { ReserveProperty } from '../../modules/house/entities/reserve-property.entity';
import { ReserveClient } from '../../modules/house/entities/reserve-client.entity';
import { Customer } from '../../modules/house/entities/customer.entity';
import { Blacklist } from '../../modules/house/entities/blacklist.entity';
import { Bill } from '../../modules/finance/entities/bill.entity';
import { FinanceFlow } from '../../modules/finance/entities/finance-flow.entity';
import { Employee } from '../../modules/system/entities/employee.entity';
import { Store } from '../../modules/system/entities/store.entity';

@Injectable()
export class BizSeedService {
  constructor(
    @InjectRepository(Community) private communityRepo: Repository<Community>,
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    @InjectRepository(Floor) private floorRepo: Repository<Floor>,
    @InjectRepository(RoomCode) private roomCodeRepo: Repository<RoomCode>,
    @InjectRepository(SaleProperty) private saleRepo: Repository<SaleProperty>,
    @InjectRepository(RentalSet) private rentalSetRepo: Repository<RentalSet>,
    @InjectRepository(RentalRoom) private rentalRoomRepo: Repository<RentalRoom>,
    @InjectRepository(ReserveProperty) private reservePropertyRepo: Repository<ReserveProperty>,
    @InjectRepository(ReserveClient) private reserveClientRepo: Repository<ReserveClient>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Blacklist) private blacklistRepo: Repository<Blacklist>,
    @InjectRepository(Bill) private billRepo: Repository<Bill>,
    @InjectRepository(FinanceFlow) private flowRepo: Repository<FinanceFlow>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Store) private storeRepo: Repository<Store>,
  ) {}

  async seedIfEmpty() {
    const saleCount = await this.saleRepo.count();
    if (saleCount > 0) return;

    const employees = await this.employeeRepo.find({ relations: ['stores', 'roles'] });
    const stores = await this.storeRepo.find();
    const admin = employees.find((e) => e.mobile === 'super_admin') || employees[0];
    const manager = employees.find((e) => e.mobile === 'store_manager') || employees[0];
    const salesman = employees.find((e) => e.mobile === 'salesman') || employees[0];
    const finance = employees.find((e) => e.mobile === 'finance') || employees[0];
    const keeper = employees.find((e) => e.mobile === 'housekeeper') || employees[0];
    const agent1 = employees.find((e) => e.mobile === 'agent01') || employees[0];
    const agent2 = employees.find((e) => e.mobile === 'agent02') || employees[0];

    const storeZhangjiang = stores.find((s) => s.name === '张江店') || stores[0];
    const storePudong = stores.find((s) => s.name === '浦东店') || stores[0];

    const community = await this.communityRepo.save({
      name: '张江汤臣豪园',
      alias: '汤臣豪园',
      cityId: storeZhangjiang.cityId,
      districtId: 1,
      businessCircle: '张江高科技园区',
      address: '上海市浦东新区张江路 123 号',
      longitude: 121.6000,
      latitude: 31.2000,
      buildingCount: 10,
      unitCount: 40,
      roomCount: 1200,
    });

    const building1 = await this.buildingRepo.save({ communityId: community.id, name: '1 号楼' });
    const building2 = await this.buildingRepo.save({ communityId: community.id, name: '2 号楼' });

    const unit1 = await this.unitRepo.save({ buildingId: building1.id, name: '1 单元' });
    const unit2 = await this.unitRepo.save({ buildingId: building1.id, name: '2 单元' });
    const unit3 = await this.unitRepo.save({ buildingId: building2.id, name: '1 单元' });

    const floor1 = await this.floorRepo.save({ unitId: unit1.id, name: '3 层' });
    const floor2 = await this.floorRepo.save({ unitId: unit1.id, name: '5 层' });
    const floor3 = await this.floorRepo.save({ unitId: unit2.id, name: '8 层' });
    const floor4 = await this.floorRepo.save({ unitId: unit3.id, name: '12 层' });

    const rooms = await this.roomCodeRepo.save([
      { floorId: floor1.id, name: '301' },
      { floorId: floor1.id, name: '302' },
      { floorId: floor2.id, name: '501' },
      { floorId: floor3.id, name: '802' },
      { floorId: floor4.id, name: '1201' },
    ]);

    await this.blacklistRepo.save([
      { name: '王老赖', mobile: '13800138001', idCard: '310101199001011111', type: 'tenant', reason: '恶意拖欠租金 3 个月', source: '系统录入', status: 'active', storeId: storeZhangjiang.id, createdBy: admin.id },
      { name: '李违约', mobile: '13900139002', idCard: '310101199002022222', type: 'landlord', reason: '签约后恶意毁约', source: '同行共享', status: 'active', storeId: storePudong.id, createdBy: admin.id },
    ]);

    const saleBase = {
      communityId: community.id,
      propertyType: 'residential',
      building: building1.name,
      unit: unit1.name,
      floor: floor1.name,
      layoutRooms: 2,
      layoutHalls: 1,
      layoutBathrooms: 1,
      layoutBalconies: 1,
      buildingArea: 88,
      orientation: 'south_north',
      decoration: 'fine',
      elevator: 'yes',
      buildYear: 2015,
      taxType: 'normal',
      certificateType: 'property',
      sourceChannel: 'walk_in',
      verified: true,
      isCitywideSale: false,
      images: [],
      tags: ['subway', 'school', 'elevator'],
    };

    await this.saleRepo.save([
      { ...saleBase, code: 'SALE2026080001', roomNo: rooms[0].name, salePrice: 6800000, unitPrice: 77273, floorPrice: 6500000, debt: 0, title: '张江汤臣豪园 2 室 2 厅 精装修', ownerName: '张业主', ownerPhone: '13700137001', status: 'published', qualityScore: 85, qualityLevel: 'A', maintainerId: salesman.id, creatorId: salesman.id, storeId: storeZhangjiang.id },
      { ...saleBase, code: 'SALE2026080002', roomNo: rooms[1].name, layoutRooms: 3, layoutHalls: 2, layoutBathrooms: 2, buildingArea: 128, decoration: 'luxury', salePrice: 9200000, unitPrice: 71875, floorPrice: 9000000, debt: 1200000, title: '张江汤臣豪园 3 室 2 厅 豪华装修', ownerName: '李业主', ownerPhone: '13700137002', status: 'bargain', qualityScore: 78, qualityLevel: 'B', maintainerId: agent1.id, creatorId: agent1.id, storeId: storeZhangjiang.id },
      { ...saleBase, code: 'SALE2026080003', roomNo: rooms[2].name, layoutRooms: 1, layoutHalls: 1, layoutBathrooms: 1, buildingArea: 58, decoration: 'simple', salePrice: 4200000, unitPrice: 72414, floorPrice: 4100000, debt: 0, title: '张江汤臣豪园 1 室 1 厅 简装', ownerName: '赵业主', ownerPhone: '13800138001', status: 'pre_publish', qualityScore: 60, qualityLevel: 'C', maintainerId: agent2.id, creatorId: agent2.id, storeId: storePudong.id },
    ]);

    const rentalBase = {
      communityId: community.id,
      bizType: 'shared',
      address: community.address,
      building: building1.name,
      unit: unit2.name,
      roomNo: rooms[3].name,
      layout: '3室1厅1卫',
      buildingArea: 110,
      decoration: 'fine',
      landlordRent: 9000,
      leaseStart: '2026-01-01',
      leaseEnd: '2027-01-01',
      status: 'active',
      creatorId: keeper.id,
      storeId: storeZhangjiang.id,
      groupId: 1,
      landlordId: 100,
      salesmanId: salesman.id,
      housekeeperId: keeper.id,
    };

    const rentalSet = await this.rentalSetRepo.save({
      ...rentalBase,
      code: 'RENT2026080001',
    });

    await this.rentalRoomRepo.save([
      { setId: rentalSet.id, roomNo: 'A', roomType: 'master_bath', rentPrice: 3200, listedPrice: 3400, status: 'rented', leaseEnd: '2026-12-31', paymentMethod: 'quarterly', leaseTerm: '1_year', depositAmount: 3200, paymentStatus: 'normal', tenantId: 1, creatorId: keeper.id },
      { setId: rentalSet.id, roomNo: 'B', roomType: 'second', rentPrice: 2600, listedPrice: 2700, status: 'vacant', paymentMethod: 'quarterly', leaseTerm: '1_year', depositAmount: 2600, paymentStatus: 'normal', creatorId: keeper.id },
      { setId: rentalSet.id, roomNo: 'C', roomType: 'small', rentPrice: 2200, listedPrice: 2300, status: 'reserved', leaseEnd: '2026-08-31', paymentMethod: 'monthly', leaseTerm: '1_year', depositAmount: 2200, paymentStatus: 'overdue', creatorId: keeper.id },
    ]);

    const reserveBase = {
      communityId: community.id,
      address: community.address,
      roomNo: '401',
      layout: '2室1厅1卫',
      buildingArea: 78,
      decoration: 'simple',
      ownerQuote: 8500,
      sourceChannel: 'peer',
      keyStatus: 'has_key',
      diskType: 'public',
      status: 'not_rented',
      followerId: keeper.id,
      creatorId: salesman.id,
    };

    await this.reservePropertyRepo.save([
      { ...reserveBase, storeId: storeZhangjiang.id, ownerName: '孙房东', ownerPhone: '13600136001', salesmanId: salesman.id },
      { ...reserveBase, storeId: storePudong.id, roomNo: '502', ownerName: '周房东', ownerPhone: '13600136002', ownerQuote: 9200, salesmanId: agent1.id },
      { ...reserveBase, storeId: storeZhangjiang.id, roomNo: '601', ownerName: '吴房东', ownerPhone: '13600136003', ownerQuote: 7800, salesmanId: agent2.id },
    ]);

    await this.reserveClientRepo.save([
      { storeId: storeZhangjiang.id, clientName: '陈租客', clientMobile: '13500135001', desiredLocation: '张江', demandType: 'rent', desiredLayout: '2室1厅', areaMin: 60, areaMax: 90, priceMin: 2500, priceMax: 3500, sourceChannel: 'online', usage: '自住', urgency: 'urgent', ownership: 'public', status: 'not_rented', salesmanId: salesman.id, creatorId: salesman.id },
      { storeId: storePudong.id, clientName: '刘租客', clientMobile: '13500135002', desiredLocation: '浦东', demandType: 'sale', desiredLayout: '3室2厅', areaMin: 100, areaMax: 130, priceMin: 5000000, priceMax: 8000000, sourceChannel: 'friend', usage: '自住', urgency: 'normal', ownership: 'public', status: 'not_rented', salesmanId: agent1.id, creatorId: agent1.id },
    ]);

    await this.customerRepo.save([
      { name: '陈租客', mobile: '13500135001', customerType: 'tenant', sourceChannel: 'online', relatedPropertyCode: 'RENT2026080001-A', contractEndDate: '2026-12-31', status: 'active', salesmanId: salesman.id, storeId: storeZhangjiang.id, creatorId: salesman.id },
      { name: '张业主', mobile: '13700137001', customerType: 'landlord', sourceChannel: 'walk_in', status: 'active', salesmanId: salesman.id, storeId: storeZhangjiang.id, creatorId: salesman.id },
      { name: '李违约', mobile: '13900139002', customerType: 'landlord', sourceChannel: 'peer', status: 'blacklist', isBlacklist: true, salesmanId: agent1.id, storeId: storePudong.id, creatorId: agent1.id },
    ]);

    const now = new Date();
    const dueSoon = new Date(now);
    dueSoon.setDate(dueSoon.getDate() + 10);
    const overdue = new Date(now);
    overdue.setDate(overdue.getDate() - 5);

    await this.billRepo.save([
      { storeId: storeZhangjiang.id, bizType: 'rent', bizId: 'RENT2026080001-A', billSource: 'rent', payer: '陈租客', payee: '优居科技', dueDate: dueSoon.toISOString().slice(0, 10), billPeriod: '2026-08', amount: 3200, actualAmount: 0, status: 'pending_receive', salesmanId: salesman.id, housekeeperId: keeper.id, roomCode: 'RENT2026080001-A', creatorId: keeper.id },
      { storeId: storeZhangjiang.id, bizType: 'rent', bizId: 'RENT2026080001-C', billSource: 'rent', payer: '未知租客', payee: '优居科技', dueDate: overdue.toISOString().slice(0, 10), billPeriod: '2026-08', amount: 2200, actualAmount: 0, status: 'pending_receive', overdueFee: 50, salesmanId: salesman.id, housekeeperId: keeper.id, roomCode: 'RENT2026080001-C', creatorId: keeper.id },
      { storeId: storePudong.id, bizType: 'sale', bizId: 'SALE2026080001', billSource: 'commission', payer: '张业主', payee: '优居科技', dueDate: now.toISOString().slice(0, 10), billPeriod: '2026-08', amount: 68000, actualAmount: 68000, status: 'received', salesmanId: salesman.id, creatorId: admin.id },
    ]);

    await this.flowRepo.save([
      { storeId: storeZhangjiang.id, amount: 3200, direction: 'income', status: 'completed', audited: true, bizType: 'rent', remark: '陈租客租金', creatorId: keeper.id },
      { storeId: storeZhangjiang.id, amount: 9000, direction: 'expense', status: 'completed', audited: true, bizType: 'landlord_rent', remark: '付孙房东承租款', creatorId: keeper.id },
      { storeId: storePudong.id, amount: 68000, direction: 'income', status: 'completed', audited: true, bizType: 'sale_commission', remark: '售房佣金', creatorId: admin.id },
    ]);
  }
}
