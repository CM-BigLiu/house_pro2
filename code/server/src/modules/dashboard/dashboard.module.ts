import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceModule } from '../finance/finance.module';
import { DashboardController } from './dashboard.controller';
import { DashboardAliasController } from './dashboard-alias.controller';
import { DashboardService } from './dashboard.service';
import { SaleProperty } from '../house/entities/sale-property.entity';
import { RentalSet } from '../house/entities/rental-set.entity';
import { RentalRoom } from '../house/entities/rental-room.entity';
import { Customer } from '../house/entities/customer.entity';
import { Bill } from '../finance/archive/bill.entity';

import { FinanceFlow } from '../finance/archive/finance-flow.entity';
import { ApprovalRecord } from '../system/entities/approval-record.entity';
import { Employee } from '../system/entities/employee.entity';

@Module({
  imports: [FinanceModule, TypeOrmModule.forFeature([SaleProperty, RentalSet, RentalRoom, Customer, Bill, FinanceFlow, ApprovalRecord, Employee])],
  controllers: [DashboardController, DashboardAliasController],
  providers: [DashboardService],
})
export class DashboardModule {}
