import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityController } from './controllers/community.controller';
import { SaleController } from './controllers/sale.controller';
import { RentalController } from './controllers/rental.controller';
import { ReserveController } from './controllers/reserve.controller';
import { CustomerController } from './controllers/customer.controller';
import { ReservePropertyController } from './controllers/reserve-property.controller';
import { ReserveClientController } from './controllers/reserve-client.controller';
import { BlacklistController } from './controllers/blacklist.controller';
import { CommunityService } from './services/community.service';
import { SaleService } from './services/sale.service';
import { RentalService } from './services/rental.service';
import { ReserveService } from './services/reserve.service';
import { CustomerService } from './services/customer.service';
import { ReservePropertyService } from './services/reserve-property.service';
import { ReserveClientService } from './services/reserve-client.service';
import { BlacklistService } from './services/blacklist.service';
import { Community } from './entities/community.entity';
import { Building, Unit, Floor, RoomCode } from './entities/community-hierarchy.entity';
import { SaleProperty } from './entities/sale-property.entity';
import { RentalSet } from './entities/rental-set.entity';
import { RentalRoom } from './entities/rental-room.entity';
import { ReserveProperty } from './entities/reserve-property.entity';
import { ReserveClient } from './entities/reserve-client.entity';
import { Customer } from './entities/customer.entity';
import { Blacklist } from './entities/blacklist.entity';
import { FollowUp } from './entities/followup.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Community, Building, Unit, Floor, RoomCode,
      SaleProperty, RentalSet, RentalRoom,
      ReserveProperty, ReserveClient, Customer, Blacklist, FollowUp,
    ]),
  ],
  controllers: [CommunityController, SaleController, RentalController, ReserveController, ReservePropertyController, ReserveClientController, CustomerController, BlacklistController],
  providers: [CommunityService, SaleService, RentalService, ReserveService, ReservePropertyService, ReserveClientService, CustomerService, BlacklistService],
  exports: [CommunityService, SaleService, RentalService, ReserveService, ReservePropertyService, ReserveClientService, CustomerService, BlacklistService],
})
export class HouseModule {}
