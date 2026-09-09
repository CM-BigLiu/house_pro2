import { Controller, Get, Post, Body, Query, UseGuards, Put, Param, ParseIntPipe } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { BillService } from '../services/bill.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { PartialType } from '@nestjs/swagger';

class CreateBillDto {
  @IsString()
  @IsNotEmpty()
  bizType: string;

  @IsString()
  @IsNotEmpty()
  billSource: string;

  @IsString()
  @IsOptional()
  payer?: string;

  @IsString()
  @IsOptional()
  payee?: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  amount: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  actualAmount?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString() @IsOptional() bizId?: string;
  @IsString() @IsOptional() paymentCount?: string;
  @IsString() @IsOptional() billPeriod?: string;
  @IsString() @IsOptional() roomCode?: string;
  @IsNumber() @IsOptional() @Type(() => Number) overdueFee?: number;
}

class UpdateBillDto extends PartialType(CreateBillDto) {}

@Controller('finance/bills')
@UseGuards(JwtAuthGuard)
export class BillController {
  constructor(private billService: BillService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.billService.findAll(query, user);
  }

  @Get(':id/edit')
  @RequirePermission('finance:bill:modify')
  async editDetail(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.billService.findOne(id, user);
  }

  @Post()
  @RequirePermission('finance:bill:modify')
  @Audit('finance', 'bill:create', { objectType: 'bill' })
  async create(@Body() data: CreateBillDto, @CurrentUser() user: any) {
    return this.billService.create(data, user);
  }

  @Put(':id')
  @RequirePermission('finance:bill:modify')
  @Audit('finance', 'bill:update', { objectType: 'bill' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateBillDto, @CurrentUser() user: any) {
    return this.billService.update(id, data, user);
  }

  @Post(':id/void')
  @RequirePermission('finance:bill:cancel')
  @Audit('finance', 'bill:void', { objectType: 'bill' })
  async void(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.billService.void(id, user);
  }
}
