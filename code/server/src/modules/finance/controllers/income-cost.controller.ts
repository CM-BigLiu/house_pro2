import { Controller, Get, Post, Body, Query, UseGuards, Put, Param, ParseIntPipe } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IncomeCostService } from '../services/income-cost.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

class CreateIncomeCostDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  storeId?: number;

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

class UpdateIncomeCostDto extends PartialType(CreateIncomeCostDto) {}

@Controller('finance/income-costs')
@UseGuards(JwtAuthGuard)
export class IncomeCostController {
  constructor(private service: IncomeCostService) {}

  @Get()
  @RequirePermission('finance:income_cost')
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Post()
  @RequirePermission('finance:income_cost:modify')
  async create(@Body() data: CreateIncomeCostDto, @CurrentUser() user: any) {
    return this.service.create(data, user);
  }
  @Put(':id')
  @RequirePermission('finance:income_cost:modify')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateIncomeCostDto, @CurrentUser() user: any) {
    return this.service.update(id, data, user);
  }

}
