import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';
import { ApprovalService } from '../services/approval.service';

class ChangeStatusDto {
  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class StatusController {
  constructor(
    private approvalService: ApprovalService,
  ) {}

  @Post('house/sale-properties/:id/change-status')
  @RequirePermission('sale:changeStatus')
  @Audit('house', 'sale:changeStatus', { objectType: 'sale_property' })
  async changeSaleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestTransition(
      'sale_property',
      id,
      dto.status,
      dto.remark,
      user,
    );
  }

  @Post('house/rental-rooms/:id/change-status')
  @RequirePermission('renting:checkout')
  @Audit('house', 'rental:changeStatus', { objectType: 'rental_room' })
  async changeRoomStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestTransition(
      'rental_room',
      id,
      dto.status,
      dto.remark,
      user,
    );
  }

  @Post('finance/bills/:id/change-status')
  @RequirePermission('finance:bill:modify')
  @Audit('finance', 'bill:changeStatus', { objectType: 'bill' })
  async changeBillStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestTransition(
      'bill',
      id,
      dto.status,
      dto.remark,
      user,
    );
  }

  @Post('finance/invoices/:id/change-status')
  @RequirePermission('finance:ticket:approve')
  @Audit('finance', 'invoice:changeStatus', { objectType: 'invoice' })
  async changeInvoiceStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestTransition(
      'invoice',
      id,
      dto.status,
      dto.remark,
      user,
    );
  }

  private requestTransition(
    entityType: string,
    id: number,
    toStatus: string,
    remark: string | undefined,
    user: CurrentUserPayload,
  ) {
    return this.approvalService.requestStatusChange(entityType, id, toStatus, user, remark);
  }
}
