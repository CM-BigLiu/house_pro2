import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { CheckoutService } from '../services/checkout.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';

class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  houseInfo: string;

  @IsString()
  @IsNotEmpty()
  tenantName: string;

  @IsString()
  @IsOptional()
  checkoutDate?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  settlementAmount?: number;

  @IsString()
  @IsOptional()
  contractCode?: string;
}

@Controller('house/checkouts')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private checkoutService: CheckoutService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.checkoutService.findAll(query, user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.checkoutService.findOne(+id, user);
  }

  @Post()
  @RequirePermission('renting:checkout')
  @Audit('house', 'checkout:create', { objectType: 'checkout' })
  async create(@Body() data: CreateCheckoutDto, @CurrentUser() user: any) {
    return this.checkoutService.create(data, user);
  }

  @Post(':id/confirm')
  @RequirePermission('checkout:confirm')
  @Audit('house', 'checkout:confirm', { objectType: 'checkout' })
  async confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.checkoutService.confirm(+id, user);
  }

  @Post(':id/complete')
  @RequirePermission('checkout:confirm')
  @Audit('house', 'checkout:complete', { objectType: 'checkout' })
  async complete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.checkoutService.complete(+id, user);
  }
}
