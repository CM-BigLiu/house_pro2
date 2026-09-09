import { Controller, Get, Post, Body, Query, UseGuards, Put, Param, ParseIntPipe } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { CustomerService } from '../services/customer.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { SkipMasking } from '../../../common/decorators/skip-masking.decorator';

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

  @IsString()
  @IsOptional()
  desiredDistrict?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  budgetMin?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  budgetMax?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @IsString()
  @IsOptional()
  @IsIn(['active', 'done', 'invalid', 'blacklist'])
  status?: string;
}

@Controller('house/customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.customerService.findAll(query, user);
  }

  @Get(':id/edit')
  @RequirePermission('house:customer:edit')
  @SkipMasking()
  async editDetail(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.customerService.findOne(id, user);
  }

  @Post()
  @RequirePermission('house:customer:create')
  async create(@Body() data: CreateCustomerDto, @CurrentUser() user: any) {
    return this.customerService.create(data, user);
  }

  @Put(':id')
  @RequirePermission('house:customer:edit')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateCustomerDto, @CurrentUser() user: any) {
    return this.customerService.update(id, data, user);
  }
}
