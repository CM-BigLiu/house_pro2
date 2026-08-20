import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { BillService } from '../services/bill.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class CreateBillDto {
  @IsString()
  @IsNotEmpty()
  bizType: string;

  @IsString()
  @IsOptional()
  billSource?: string;

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
}

@Controller('finance/bills')
@UseGuards(JwtAuthGuard)
export class BillController {
  constructor(private billService: BillService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.billService.findAll(query, user);
  }

  @Post()
  async create(@Body() data: CreateBillDto) {
    return this.billService.create(data);
  }
}
