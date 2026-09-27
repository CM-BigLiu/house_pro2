import { Controller, Delete, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PartialType } from '@nestjs/swagger';
import { ArrayMaxSize, IsBoolean, IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsIn, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RentalService } from '../services/rental.service';
import { BEIJING_DISTRICTS } from '../../../common/constants/beijing-districts';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { SkipMasking } from '../../../common/decorators/skip-masking.decorator';

export class CreateRentalRoomDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @IsString()
  @IsNotEmpty()
  roomNo: string;

  @IsString()
  @IsOptional()
  roomType?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  rentPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  listedPrice?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  leaseStart?: string;

  @IsString()
  @IsOptional()
  tenantName?: string;

  @IsString()
  @IsOptional()
  tenantPhone?: string;

  @IsString()
  @IsOptional()
  tenantIdCard?: string;

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
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  depositAmount?: number;

  @IsString()
  @IsOptional()
  paymentStatus?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  tenantId?: number;
}

export class RentalEmergencyContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  relation?: string;
}

export class CreateRentalSetDto {
  @IsOptional()
  @IsBoolean()
  isManaged?: boolean;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsIn(['entire', 'shared'])
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
  @IsOptional()
  floor?: string;

  @IsNumber()
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  totalFloor?: number;

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
  district?: string;

  @IsString()
  @IsOptional()
  propertyType?: string;

  @IsString()
  @IsOptional()
  orientation?: string;

  @IsString()
  @IsOptional()
  elevator?: string;

  @IsString()
  @IsOptional()
  decoration?: string;

  @IsString()
  @IsOptional()
  sourceChannel?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  communityIntro?: string;

  @IsString()
  @IsOptional()
  nearbySchool?: string;

  @IsString()
  @IsOptional()
  taxDescription?: string;

  @IsString()
  @IsOptional()
  advantages?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  facilities?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  landlordRent?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  landlordDeposit?: number;

  @IsString()
  @IsOptional()
  landlordName?: string;

  @IsString()
  @IsOptional()
  landlordPhone?: string;

  @IsString()
  @IsOptional()
  landlordPhoneBackup?: string;

  @IsString()
  @IsOptional()
  landlordRemark?: string;

  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => RentalEmergencyContactDto)
  @IsOptional()
  emergencyContacts?: RentalEmergencyContactDto[];

  @IsString()
  @IsOptional()
  viewingTime?: string;

  @IsString()
  @IsOptional()
  viewingTimeAlt?: string;

  @IsString()
  @IsOptional()
  followUpContent?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  landlordIdCard?: string;

  @IsString()
  @IsOptional()
  landlordBankCard?: string;

  @IsString()
  @IsOptional()
  landlordBankName?: string;

  @IsString()
  @IsOptional()
  tenantName?: string;

  @IsString()
  @IsOptional()
  tenantPhone?: string;

  @IsString()
  @IsOptional()
  tenantIdCard?: string;

  @IsString()
  @IsOptional()
  tenantPaymentMethod?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  deposit?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  leaseStart?: string;

  @IsString()
  @IsOptional()
  leaseEnd?: string;

  @IsString()
  @IsOptional()
  landlordPaymentMethod?: string;

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
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  rent?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateRentalRoomDto)
  rooms?: CreateRentalRoomDto[];
}

class UpdateRentalSetDto extends PartialType(CreateRentalSetDto) {}

@Controller('house/rental-sets')
@UseGuards(JwtAuthGuard)
export class RentalController {
  constructor(private rentalService: RentalService) {}

  @Get()
  @RequirePermission('house:rent')
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.rentalService.findSets(query, user);
  }

  @Get('district-options')
  @RequirePermission('house:rent')
  districtOptions() {
    return BEIJING_DISTRICTS;
  }

  @Get(':id')
  @RequirePermission('renting:edit')
  @SkipMasking()
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rentalService.findSet(+id, user);
  }

  @Post()
  @RequirePermission('renting:add')
  @Audit('house', 'rental:create', { objectType: 'rental_set' })
  async create(@Body() data: CreateRentalSetDto, @CurrentUser() user: any) {
    return this.rentalService.createSet(data, user);
  }

  @Put(':id')
  @RequirePermission('renting:edit')
  @Audit('house', 'rental:update', { objectType: 'rental_set' })
  async update(
    @Param('id') id: string,
    @Body() data: UpdateRentalSetDto,
    @CurrentUser() user: any,
  ) {
    return this.rentalService.updateSet(+id, data, user);
  }

  @Delete(':id')
  @RequirePermission('renting:delete')
  @Audit('house', 'rental:delete', { objectType: 'rental_set' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rentalService.removeSet(+id, user);
  }
}
