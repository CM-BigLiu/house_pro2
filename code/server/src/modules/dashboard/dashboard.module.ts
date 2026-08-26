import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SaleProperty } from '../house/entities/sale-property.entity';
import { RentalSet } from '../house/entities/rental-set.entity';
import { RentalRoom } from '../house/entities/rental-room.entity';
import { ReserveClient } from '../house/entities/reserve-client.entity';
import { Customer } from '../house/entities/customer.entity';
import { Bill } from '../finance/entities/bill.entity';

import { FinanceFlow } from '../finance/entities/finance-flow.entity';
import { ApprovalRecord } from '../system/entities/approval-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SaleProperty, RentalSet, RentalRoom, ReserveClient, Customer, Bill, FinanceFlow, ApprovalRecord])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
