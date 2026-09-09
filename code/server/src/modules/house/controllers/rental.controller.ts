import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsIn, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RentalService } from '../services/rental.service';
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
}

export class CreateRentalSetDto {
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
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  landlordRent?: number;

  @IsString()
  @IsOptional()
  landlordName?: string;

  @IsString()
  @IsOptional()
  landlordPhone?: string;

  @IsString()
  @IsOptional()
  tenantName?: string;

  @IsString()
  @IsOptional()
  tenantPhone?: string;

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
}
