import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceController } from './controllers/invoice.controller';
import { PlanController } from './controllers/plan.controller';
import { ArrearController } from './controllers/arrear.controller';
import { IncomeCostController } from './controllers/income-cost.controller';
import { PerformanceController } from './controllers/performance.controller';
import { AccountingController } from './controllers/accounting.controller';
import { InvoiceService } from './services/invoice.service';
import { PlanService } from './services/plan.service';
import { ArrearService } from './services/arrear.service';
import { IncomeCostService } from './services/income-cost.service';
import { PerformanceService } from './services/performance.service';
import { AccountingService } from './services/accounting.service';
import { Invoice } from './entities/invoice.entity';
import { PaymentPlan } from './entities/payment-plan.entity';
import { Arrear } from './entities/arrear.entity';
import { IncomeCost } from './entities/income-cost.entity';
import { Performance } from './entities/performance.entity';
import { Accounting } from './entities/accounting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Invoice, PaymentPlan, Arrear,
    IncomeCost, Performance, Accounting,
  ])],
  controllers: [
    InvoiceController, PlanController, ArrearController,
    IncomeCostController, PerformanceController, AccountingController,
  ],
  providers: [
    InvoiceService, PlanService, ArrearService,
    IncomeCostService, PerformanceService, AccountingService,
  ],
  exports: [
    InvoiceService, PlanService, ArrearService,
    IncomeCostService, PerformanceService, AccountingService,
  ],
})
export class FinanceModule {}
