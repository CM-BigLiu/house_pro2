import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityController, CommunityAliasController } from './controllers/community.controller';
import { SaleController } from './controllers/sale.controller';
import { RentalController } from './controllers/rental.controller';
import { CustomerController } from './controllers/customer.controller';
import { PropertyController } from './controllers/property.controller';
import { BlacklistController } from './controllers/blacklist.controller';
import { CommunityService } from './services/community.service';
import { SaleService } from './services/sale.service';
import { RentalService } from './services/rental.service';
import { CustomerService } from './services/customer.service';
import { BlacklistService } from './services/blacklist.service';
import { Community } from './entities/community.entity';
import { Building, Unit, Floor, RoomCode } from './entities/community-hierarchy.entity';
import { SaleProperty } from './entities/sale-property.entity';
import { RentalSet } from './entities/rental-set.entity';
import { RentalRoom } from './entities/rental-room.entity';
import { Customer } from './entities/customer.entity';
import { Blacklist } from './entities/blacklist.entity';
import { FollowUp } from './entities/follow-up.entity';
import { OperationLogController } from './controllers/operation-log.controller';
import { OperationLogService } from './services/operation-log.service';
import { OperationLog } from '../system/entities/operation-log.entity';
import { CheckoutController } from './controllers/checkout.controller';
import { DepositController } from './controllers/deposit.controller';
import { CheckoutService } from './services/checkout.service';
import { DepositService } from './services/deposit.service';
import { Checkout } from './entities/checkout.entity';
import { Deposit } from './entities/deposit.entity';
import { Employee } from '../system/entities/employee.entity';
import { SystemModule } from '../system/system.module';
import { PropertyDetailController } from './controllers/property-detail.controller';
import { PropertyDetailService } from './services/property-detail.service';
import { RentalAppointment } from './entities/rental-appointment.entity';
import { RentalAppointmentAction } from './entities/rental-appointment-action.entity';
import { RentalAppointmentController } from './controllers/rental-appointment.controller';
import { RentalAppointmentService } from './services/rental-appointment.service';
import { PropertyManagementController } from './controllers/property-management.controller';
import { PropertyManagementService } from './services/property-management.service';
import { Deal } from './entities/deal.entity';
import { SaleAppointment } from './entities/sale-appointment.entity';
import { CustomerWorkflowService } from './services/customer-workflow.service';
import { CustomerWorkflowController, DealsController } from './controllers/customer-workflow.controller';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [
    FinanceModule,
    SystemModule,
    TypeOrmModule.forFeature([
      Community, Building, Unit, Floor, RoomCode,
      SaleProperty, RentalSet, RentalRoom,
      Customer, Blacklist, FollowUp,
      OperationLog, Checkout, Deposit, Employee, RentalAppointment, RentalAppointmentAction,
      Deal, SaleAppointment,
    ]),
  ],
  controllers: [CustomerWorkflowController, DealsController, PropertyManagementController, PropertyDetailController, CommunityController, CommunityAliasController, SaleController, RentalController, RentalAppointmentController, CustomerController, BlacklistController, OperationLogController, PropertyController, CheckoutController, DepositController],
  providers: [CustomerWorkflowService, PropertyManagementService, PropertyDetailService, CommunityService, SaleService, RentalService, RentalAppointmentService, CustomerService, BlacklistService, OperationLogService, CheckoutService, DepositService],
  exports: [CommunityService, SaleService, RentalService, RentalAppointmentService, CustomerService, BlacklistService, OperationLogService, CheckoutService, DepositService],
})
export class HouseModule {}
