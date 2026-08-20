import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PerformanceService } from '../services/performance.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class CreatePerformanceDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  storeId: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  employeeId: number;

  @IsString()
  @IsNotEmpty()
  employeeName: string;

  @IsString()
  @IsNotEmpty()
  period: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  newHouseCount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  newCustomerCount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  showingCount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  dealCount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  totalPerformance?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  distributed?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  retained?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  transferred?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  commission?: number;
}

@Controller('finance/performances')
@UseGuards(JwtAuthGuard)
export class PerformanceController {
  constructor(private service: PerformanceService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Post()
  async create(@Body() data: CreatePerformanceDto) {
    return this.service.create(data);
  }
}
