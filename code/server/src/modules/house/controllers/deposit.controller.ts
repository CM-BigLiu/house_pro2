import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { DepositService } from '../services/deposit.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';

class DeductDepositDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

@Controller('house/deposits')
@UseGuards(JwtAuthGuard)
export class DepositController {
  constructor(private depositService: DepositService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.depositService.findAll(query, user);
  }

  @Post(':id/refund')
  @RequirePermission('deposit:refund')
  @Audit('house', 'deposit:refund', { objectType: 'deposit' })
  async refund(@Param('id') id: string, @CurrentUser() user: any) {
    return this.depositService.refund(+id, user);
  }

  @Post(':id/deduct')
  @RequirePermission('deposit:deduct')
  @Audit('house', 'deposit:deduct', { objectType: 'deposit' })
  async deduct(@Param('id') id: string, @Body() data: DeductDepositDto, @CurrentUser() user: any) {
    return this.depositService.deduct(+id, user, data?.reason);
  }
}
