import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillController } from './controllers/bill.controller';
import { FlowController } from './controllers/flow.controller';
import { InvoiceController } from './controllers/invoice.controller';
import { PayoutController } from './controllers/payout.controller';
import { PlanController } from './controllers/plan.controller';
import { ArrearController } from './controllers/arrear.controller';
import { RentIncreaseController } from './controllers/rent-increase.controller';
import { ProfitController } from './controllers/profit.controller';
import { PartnerController } from './controllers/partner.controller';
import { IncomeCostController } from './controllers/income-cost.controller';
import { PerformanceController } from './controllers/performance.controller';
import { AccountingController } from './controllers/accounting.controller';
import { BillService } from './services/bill.service';
import { FlowService } from './services/flow.service';
import { InvoiceService } from './services/invoice.service';
import { PayoutService } from './services/payout.service';
import { PlanService } from './services/plan.service';
import { ArrearService } from './services/arrear.service';
import { RentIncreaseService } from './services/rent-increase.service';
import { ProfitService } from './services/profit.service';
import { PartnerService } from './services/partner.service';
import { IncomeCostService } from './services/income-cost.service';
import { PerformanceService } from './services/performance.service';
import { AccountingService } from './services/accounting.service';
import { Bill } from './entities/bill.entity';
import { FinanceFlow } from './entities/finance-flow.entity';
import { Invoice } from './entities/invoice.entity';
import { Payout } from './entities/payout.entity';
import { PaymentPlan } from './entities/payment-plan.entity';
import { Arrear } from './entities/arrear.entity';
import { RentIncrease } from './entities/rent-increase.entity';
import { Profit } from './entities/profit.entity';
import { Partner } from './entities/partner.entity';
import { IncomeCost } from './entities/income-cost.entity';
import { Performance } from './entities/performance.entity';
import { Accounting } from './entities/accounting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Bill, FinanceFlow, Invoice, Payout, PaymentPlan, Arrear,
    RentIncrease, Profit, Partner, IncomeCost, Performance, Accounting,
  ])],
  controllers: [
    BillController, FlowController, InvoiceController, PayoutController, PlanController, ArrearController,
    RentIncreaseController, ProfitController, PartnerController, IncomeCostController, PerformanceController, AccountingController,
  ],
  providers: [
    BillService, FlowService, InvoiceService, PayoutService, PlanService, ArrearService,
    RentIncreaseService, ProfitService, PartnerService, IncomeCostService, PerformanceService, AccountingService,
  ],
  exports: [
    BillService, FlowService, InvoiceService, PayoutService, PlanService, ArrearService,
    RentIncreaseService, ProfitService, PartnerService, IncomeCostService, PerformanceService, AccountingService,
  ],
})
export class FinanceModule {}
