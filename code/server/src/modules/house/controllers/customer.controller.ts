import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerService } from '../services/customer.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsOptional()
  idCard?: string;

  @IsString()
  @IsNotEmpty()
  customerType: string;

  @IsString()
  @IsOptional()
  sourceChannel?: string;

  @IsString()
  @IsOptional()
  relatedPropertyCode?: string;

  @IsString()
  @IsOptional()
  contractEndDate?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  salesmanId?: number;

  @IsBoolean()
  @IsOptional()
  isBlacklist?: boolean;
}

@Controller('house/customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.customerService.findAll(query, user);
  }

  @Post()
  @RequirePermission('house:customer:create')
  async create(@Body() data: CreateCustomerDto, @CurrentUser() user: any) {
    return this.customerService.create(data, user);
  }
}
