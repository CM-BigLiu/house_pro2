import { Controller, Delete, Get, Post, Body, Put, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn, IsDateString, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReservePropertyService } from '../services/reserve-property.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { SkipMasking } from '../../../common/decorators/skip-masking.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';

class CreateReservePropertyDto {
  @IsIn(['rent', 'sale'])
  @IsOptional()
  reserveType?: 'rent' | 'sale';

  @IsObject()
  @IsOptional()
  details?: Record<string, unknown>;

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
  communityId?: number;

  @IsString()
  @IsOptional()
  address: string;

  @IsString()
  @IsOptional()
  roomNo: string;

  @IsString()
  @IsOptional()
  layout: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  buildingArea?: number;

  @IsString()
  @IsOptional()
  decoration?: string;

  @IsString()
  @IsOptional()
  ownerName: string;

  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  ownerQuote?: number;

  @IsString()
  @IsOptional()
  sourceChannel: string;

  @IsString()
  @IsOptional()
  keyStatus?: string;

  @IsString()
  @IsOptional()
  diskType?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  salesmanId?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  followerId?: number;

  @IsString()
  @IsOptional()
  followDate?: string;
}

class UpdateReservePropertyDto {
  @IsIn(['rent', 'sale'])
  @IsOptional()
  reserveType?: 'rent' | 'sale';

  @IsObject()
  @IsOptional()
  details?: Record<string, unknown>;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  communityId?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  roomNo?: string;

  @IsString()
  @IsOptional()
  layout?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  buildingArea?: number;

  @IsString()
  @IsOptional()
  decoration?: string;

  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  ownerQuote?: number;

  @IsString()
  @IsOptional()
  sourceChannel?: string;

  @IsString()
  @IsOptional()
  keyStatus?: string;

  @IsString()
  @IsOptional()
  diskType?: string;

}

class TransferReservePropertyDto {
  @IsNumber()
  @Type(() => Number)
  salesmanId: number;
}

class SignReservePropertyDto {
  @IsString()
  @IsOptional()
  contractCode?: string;

  @IsString()
  @IsIn(['entire', 'shared'])
  bizType: string;

  @IsDateString()
  leaseStart: string;

  @IsDateString()
  leaseEnd: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  landlordRent: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  landlordDeposit?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  communityId?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  roomNo?: string;

  @IsString()
  @IsOptional()
  layout?: string;

  @IsString()
  @IsOptional()
  ownerName?: string;
}

@Controller('house/reserve-properties')
@UseGuards(JwtAuthGuard)
export class ReservePropertyController {
  constructor(private service: ReservePropertyService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Post()
  @RequirePermission('reserve:house:add')
  async create(@Body() data: CreateReservePropertyDto, @CurrentUser() user: any) {
    return this.service.create(data, user);
  }

  @Get(':id/edit')
  @RequirePermission('reserve:house:add')
  @SkipMasking()
  async editDetail(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.findOne(id, user);
  }

  @Put(':id')
  @RequirePermission('reserve:house:add')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateReservePropertyDto, @CurrentUser() user: any) {
    return this.service.update(id, data, user);
  }

  @Delete(':id')
  @RequirePermission('reserve:house:delete')
  @Audit('house', 'reserve-property:delete', { objectType: 'reserve_property' })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }

  @Post(':id/transfer')
  @RequirePermission('reserve:house:transfer')
  async transfer(@Param('id', ParseIntPipe) id: number, @Body() data: TransferReservePropertyDto, @CurrentUser() user: any) {
    return this.service.transfer(id, data.salesmanId, user);
  }

  @Post(':id/sign-contract')
  @RequirePermission('reserve:house:take')
  async signContract(@Param('id', ParseIntPipe) id: number, @Body() data: SignReservePropertyDto, @CurrentUser() user: any) {
    return this.service.signContract(id, data, user);
  }
}
