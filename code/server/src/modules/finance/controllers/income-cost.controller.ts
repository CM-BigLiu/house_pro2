import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { IncomeCostService } from '../services/income-cost.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class CreateIncomeCostDto {
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
  rentIncome?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  depositIncome?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  energyIncome?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  otherIncome?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  rentCost?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  energyCost?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  decorateCost?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  laborCost?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  otherCost?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  totalIncome?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  totalCost?: number;
}

@Controller('finance/income-costs')
@UseGuards(JwtAuthGuard)
export class IncomeCostController {
  constructor(private service: IncomeCostService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Post()
  async create(@Body() data: CreateIncomeCostDto) {
    return this.service.create(data);
  }
}
