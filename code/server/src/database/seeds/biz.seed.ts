import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from '../../modules/house/entities/community.entity';
import { Building, Unit, Floor, RoomCode } from '../../modules/house/entities/community-hierarchy.entity';
import { SaleProperty } from '../../modules/house/entities/sale-property.entity';
import { RentalSet } from '../../modules/house/entities/rental-set.entity';
import { RentalRoom } from '../../modules/house/entities/rental-room.entity';
import { Checkout } from '../../modules/house/entities/checkout.entity';
import { Deposit } from '../../modules/house/entities/deposit.entity';
import { Customer } from '../../modules/house/entities/customer.entity';
import { Employee } from '../../modules/system/entities/employee.entity';
import { Store } from '../../modules/system/entities/store.entity';
import { OperationLog } from '../../modules/system/entities/operation-log.entity';
import { Config } from '../../modules/system/entities/config.entity';

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
    @InjectRepository(Checkout) private checkoutRepo: Repository<Checkout>,
    @InjectRepository(Deposit) private depositRepo: Repository<Deposit>,
    @InjectRepository(OperationLog) private operationLogRepo: Repository<OperationLog>,
    @InjectRepository(Config) private configRepo: Repository<Config>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
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

    await this.checkoutRepo.save([
      { contractCode: 'CO2026080001', tenantName: '陈租客', houseInfo: '张江汤臣豪园 1 号楼 2 单元 802 A室', checkoutDate: '2026-08-31', status: 'pending', settlementAmount: -200, reason: '租期到期', storeId: storeZhangjiang.id, creatorId: keeper.id },
      { contractCode: 'CO2026080002', tenantName: '刘租客', houseInfo: '张江汤臣豪园 1 号楼 2 单元 802 C室', checkoutDate: '2026-08-15', status: 'confirmed', settlementAmount: 3200, reason: '工作调动', storeId: storeZhangjiang.id, creatorId: salesman.id },
    ]);

    await this.depositRepo.save([
      { contractCode: 'RENT2026080001-A', tenantName: '陈租客', houseInfo: '张江汤臣豪园 1 号楼 2 单元 802 A室', depositAmount: 3200, status: 'pending', depositDate: '2026-01-01', storeId: storeZhangjiang.id, creatorId: keeper.id },
      { contractCode: 'RENT2026080001-B', tenantName: '王租客', houseInfo: '张江汤臣豪园 1 号楼 2 单元 802 B室', depositAmount: 2600, status: 'refunded', depositDate: '2026-01-15', refundDate: '2026-07-20', storeId: storeZhangjiang.id, creatorId: keeper.id },
      { contractCode: 'RENT2026080001-C', tenantName: '赵租客', houseInfo: '张江汤臣豪园 1 号楼 2 单元 802 C室', depositAmount: 2200, status: 'deducted', depositDate: '2026-02-01', deductReason: '墙面损坏赔偿 500 元', storeId: storeZhangjiang.id, creatorId: keeper.id },
    ]);

    await this.customerRepo.save([
      { name: '陈租客', mobile: '13500135001', customerType: 'tenant', sourceChannel: 'online', relatedPropertyCode: 'RENT2026080001-A', contractEndDate: '2026-12-31', status: 'active', salesmanId: salesman.id, storeId: storeZhangjiang.id, creatorId: salesman.id },
      { name: '张业主', mobile: '13700137001', customerType: 'landlord', sourceChannel: 'walk_in', status: 'active', salesmanId: salesman.id, storeId: storeZhangjiang.id, creatorId: salesman.id },
      { name: '李违约', mobile: '13900139002', customerType: 'landlord', sourceChannel: 'peer', status: 'active', salesmanId: agent1.id, storeId: storePudong.id, creatorId: agent1.id },
    ]);

    await this.configRepo.save([
      { configKey: 'system.company_name', configValue: '优居科技', description: '公司名称', group: 'system', sort: 1 },
      { configKey: 'system.page_size', configValue: '20', description: '默认分页大小', group: 'system', sort: 2 },
      { configKey: 'business.sale_approval', configValue: 'false', description: '售房成交是否需要审批', group: 'business', sort: 2 },
      { configKey: 'finance.deposit_months', configValue: '1', description: '默认押金月数', group: 'finance', sort: 1 },
      { configKey: 'finance.overdue_rate', configValue: '0.05', description: '逾期罚金日利率', group: 'finance', sort: 2 },
      { configKey: 'notification.sms_enabled', configValue: 'true', description: '短信通知开关', group: 'notification', sort: 1 },
      { configKey: 'notification.email_enabled', configValue: 'false', description: '邮件通知开关', group: 'notification', sort: 2 },
    ]);

    await this.operationLogRepo.save([
      { employeeId: admin.id, module: 'system', action: 'login', objectType: 'auth', objectId: '', ip: '127.0.0.1', result: 'success' },
      { employeeId: salesman.id, module: 'house', action: 'sale:edit', objectType: 'sale_property', objectId: 'SALE2026080001', ip: '192.168.1.10', result: 'success' },
      { employeeId: keeper.id, module: 'house', action: 'renting:add', objectType: 'rental_room', objectId: 'RENT2026080001', ip: '192.168.1.11', result: 'success' },
    ]);
  }
}
