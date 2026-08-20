import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PlanService } from '../services/plan.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class CreatePlanDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  storeId: number;

  @IsString()
  @IsNotEmpty()
  planType: string;

  @IsString()
  @IsNotEmpty()
  billingCategory: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  relatedPartyType?: string;

  @IsString()
  @IsOptional()
  relatedPartyName?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  totalPeriods?: number;

  @IsString()
  @IsOptional()
  paymentInterval?: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  totalAmount: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

@Controller('finance/plans')
@UseGuards(JwtAuthGuard)
export class PlanController {
  constructor(private planService: PlanService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.planService.findAll(query, user);
  }

  @Post()
  async create(@Body() data: CreatePlanDto) {
    return this.planService.create(data);
  }
}
