import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ProfitService } from '../services/profit.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class CreateProfitDto {
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
  income?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  cost?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  profit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  margin?: number;

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
}

@Controller('finance/profits')
@UseGuards(JwtAuthGuard)
export class ProfitController {
  constructor(private service: ProfitService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Get('summary')
  async summary(@CurrentUser() user: any) {
    return this.service.summary(user);
  }

  @Post()
  async create(@Body() data: CreateProfitDto) {
    return this.service.create(data);
  }
}
