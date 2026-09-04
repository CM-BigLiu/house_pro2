import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { RentalService } from '../services/rental.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';

class CreateRentalRoomDto {
  @IsString()
  @IsNotEmpty()
  roomNo: string;

  @IsString()
  @IsOptional()
  roomType?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  rentPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  listedPrice?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  leaseEnd?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  leaseTerm?: string;

  @IsString()
  @IsOptional()
  renovationProgress?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Type(() => Number)
  cohabitantIds?: number[];

  @IsString()
  @IsOptional()
  leaseDuration?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  arrearDays?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  depositAmount?: number;
}

class CreateRentalSetDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  bizType: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  communityId: number;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  building: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsString()
  @IsNotEmpty()
  roomNo: string;

  @IsString()
  @IsNotEmpty()
  layout: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  buildingArea?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  interiorArea?: number;

  @IsString()
  @IsOptional()
  businessCircle?: string;

  @IsString()
  @IsOptional()
  decoration?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  landlordRent?: number;

  @IsString()
  @IsOptional()
  leaseStart?: string;

  @IsString()
  @IsOptional()
  leaseEnd?: string;

  @IsString()
  @IsOptional()
  rentFreePeriod?: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  storeId: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  groupId?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  landlordId?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  salesmanId?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  housekeeperId?: number;

  @IsString()
  @IsOptional()
  tenantLeaseStart?: string;

  @IsString()
  @IsOptional()
  tenantLeaseEnd?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  rent?: number;

  @IsArray()
  @IsOptional()
  rooms?: CreateRentalRoomDto[];
}

@Controller('house/rental-sets')
@UseGuards(JwtAuthGuard)
export class RentalController {
  constructor(private rentalService: RentalService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.rentalService.findSets(query, user);
  }

  @Post()
  @Audit('house', 'rental:create', { objectType: 'rental_set' })
  async create(@Body() data: any, @CurrentUser() user: any) {
    return this.rentalService.createSet(data, user);
  }
}
