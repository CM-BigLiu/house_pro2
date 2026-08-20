import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountingService } from '../services/accounting.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class CreateAccountingDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  storeId: number;

  @IsString()
  @IsNotEmpty()
  period: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  revenue?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  receivable?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  payable?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  actualIncome?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  actualExpense?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  diff?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

@Controller('finance/accountings')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private service: AccountingService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Post()
  async create(@Body() data: CreateAccountingDto) {
    return this.service.create(data);
  }
}
