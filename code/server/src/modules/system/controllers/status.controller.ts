import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';
import { StateMachineService } from '../../../common/services/state-machine.service';
import { ApprovalService } from '../services/approval.service';
import { SaleProperty } from '../../house/entities/sale-property.entity';
import { RentalRoom } from '../../house/entities/rental-room.entity';
import { Bill } from '../../finance/entities/bill.entity';
import { Invoice } from '../../finance/entities/invoice.entity';

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
    @InjectRepository(SaleProperty)
    private saleRepo: Repository<SaleProperty>,
    @InjectRepository(RentalRoom)
    private roomRepo: Repository<RentalRoom>,
    @InjectRepository(Bill)
    private billRepo: Repository<Bill>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    private stateMachine: StateMachineService,
    private approvalService: ApprovalService,
  ) {}

  @Post('house/sale-properties/:id/change-status')
  @RequirePermission('sale:changeStatus')
  @Audit('house', 'sale:changeStatus', { objectType: 'sale_property' })
  async changeSaleStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.doTransition(
      'sale_property',
      this.saleRepo,
      +id,
      dto.status,
      dto.remark,
      user,
    );
  }

  @Post('house/rental-rooms/:id/change-status')
  @RequirePermission('renting:checkout')
  @Audit('house', 'rental:changeStatus', { objectType: 'rental_room' })
  async changeRoomStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.doTransition(
      'rental_room',
      this.roomRepo,
      +id,
      dto.status,
      dto.remark,
      user,
    );
  }

  @Post('finance/bills/:id/change-status')
  @RequirePermission('finance:bill:modify')
  @Audit('finance', 'bill:changeStatus', { objectType: 'bill' })
  async changeBillStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.doTransition(
      'bill',
      this.billRepo,
      +id,
      dto.status,
      dto.remark,
      user,
    );
  }

  @Post('finance/invoices/:id/change-status')
  @RequirePermission('finance:ticket:approve')
  @Audit('finance', 'invoice:changeStatus', { objectType: 'invoice' })
  async changeInvoiceStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.doTransition(
      'invoice',
      this.invoiceRepo,
      +id,
      dto.status,
      dto.remark,
      user,
    );
  }

  private async doTransition<T extends { id: number; status: string }>(
    entityType: string,
    repo: Repository<T>,
    id: number,
    toStatus: string,
    remark: string | undefined,
    user: CurrentUserPayload,
  ) {
    const entity = await repo.findOne({ where: { id } as any });
    if (!entity) throw new BadRequestException('记录不存在');
    const fromStatus = entity.status;
    const check = this.stateMachine.transition(entityType, fromStatus, toStatus);
    if (!check.success) {
      throw new BadRequestException(check.message);
    }
    entity.status = toStatus;
    const saved = await repo.save(entity as any);
    await this.approvalService.submit({
      entityType,
      entityId: id,
      action: 'change_status',
      fromStatus,
      toStatus,
      operatorId: user.employeeId,
      remark,
    });
    return saved;
  }
}
