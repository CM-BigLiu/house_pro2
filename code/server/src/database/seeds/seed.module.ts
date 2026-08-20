import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from '../../config/database.config';
import { SeedService } from './seed.service';
import { BizSeedService } from './biz.seed';
import { Company } from '../../modules/system/entities/company.entity';
import { City } from '../../modules/system/entities/city.entity';
import { Store } from '../../modules/system/entities/store.entity';
import { Department } from '../../modules/system/entities/department.entity';
import { Position } from '../../modules/system/entities/position.entity';
import { Employee } from '../../modules/system/entities/employee.entity';
import { Role } from '../../modules/system/entities/role.entity';
import { Permission } from '../../modules/system/entities/permission.entity';
import { Dict } from '../../modules/system/entities/dict.entity';
import { DictItem } from '../../modules/system/entities/dict-item.entity';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot(databaseConfig()),
    TypeOrmModule.forFeature([
      Company, City, Store, Department, Position, Employee, Role, Permission, Dict, DictItem,
      Community, Building, Unit, Floor, RoomCode, SaleProperty, RentalSet, RentalRoom,
      ReserveProperty, ReserveClient, Customer, Blacklist, Bill, FinanceFlow,
    ]),
  ],
  providers: [SeedService, BizSeedService],
})
export class SeedModule {}
