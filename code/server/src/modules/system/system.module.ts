import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DictController } from './controllers/dict.controller';
import { EmployeeController } from './controllers/employee.controller';
import { RoleController } from './controllers/role.controller';
import { PermissionController } from './controllers/permission.controller';
import { StoreController } from './controllers/store.controller';
import { StatusController } from './controllers/status.controller';
import { ApprovalController } from './controllers/approval.controller';
import { PositionController } from './controllers/position.controller';
import { DictService } from './services/dict.service';
import { EmployeeService } from './services/employee.service';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { StoreService } from './services/store.service';
import { Company } from './entities/company.entity';
import { City } from './entities/city.entity';
import { Store } from './entities/store.entity';
import { Department } from './entities/department.entity';
import { Group } from './entities/group.entity';
import { Position } from './entities/position.entity';
import { Employee } from './entities/employee.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Dict } from './entities/dict.entity';
import { DictItem } from './entities/dict-item.entity';
import { OperationLog } from './entities/operation-log.entity';
import { ApprovalRecord } from './entities/approval-record.entity';
import { ApprovalService } from './services/approval.service';
import { StateMachineService } from '../../common/services/state-machine.service';
import { SaleProperty } from '../house/entities/sale-property.entity';
import { RentalRoom } from '../house/entities/rental-room.entity';
import { Bill } from '../finance/entities/bill.entity';
import { Invoice } from '../finance/entities/invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company, City, Store, Department, Group, Position,
      Employee, Role, Permission, Dict, DictItem, OperationLog,
      ApprovalRecord, SaleProperty, RentalRoom, Bill, Invoice,
    ]),
  ],
  controllers: [DictController, EmployeeController, RoleController, PermissionController, StoreController, StatusController, ApprovalController, PositionController],
  providers: [DictService, EmployeeService, RoleService, PermissionService, StoreService, ApprovalService, StateMachineService],
  exports: [DictService, EmployeeService, RoleService, PermissionService, StoreService, ApprovalService, StateMachineService],
})
export class SystemModule {}
