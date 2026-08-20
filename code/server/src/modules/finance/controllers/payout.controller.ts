import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PayoutService } from '../services/payout.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class CreatePayoutDto {
  @IsString()
  @IsOptional()
  batchNo?: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  storeId: number;

  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsOptional()
  bankCardNo?: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  cardType: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  payoutAmount: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  serviceFeeBorneByPayee?: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  payableAmount: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  serviceFee?: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  actualAmount: number;

  @IsString()
  @IsOptional()
  merchantNo?: string;

  @IsString()
  @IsNotEmpty()
  operateDate: string;
}

@Controller('finance/payouts')
@UseGuards(JwtAuthGuard)
export class PayoutController {
  constructor(private payoutService: PayoutService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.payoutService.findAll(query, user);
  }

  @Post()
  async create(@Body() data: CreatePayoutDto) {
    return this.payoutService.create(data);
  }
}
