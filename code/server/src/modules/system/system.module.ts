import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DictController } from './controllers/dict.controller';
import { EmployeeController } from './controllers/employee.controller';
import { RoleController } from './controllers/role.controller';
import { PermissionController } from './controllers/permission.controller';
import { StoreController } from './controllers/store.controller';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company, City, Store, Department, Group, Position,
      Employee, Role, Permission, Dict, DictItem, OperationLog,
    ]),
  ],
  controllers: [DictController, EmployeeController, RoleController, PermissionController, StoreController],
  providers: [DictService, EmployeeService, RoleService, PermissionService, StoreService],
  exports: [DictService, EmployeeService, RoleService, PermissionService, StoreService],
})
export class SystemModule {}
