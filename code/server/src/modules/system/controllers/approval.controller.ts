import { Controller, Get, Post, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApprovalService } from '../services/approval.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';

class SubmitApprovalDto {
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  entityId: number;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsOptional()
  fromStatus?: string;

  @IsString()
  @IsOptional()
  toStatus?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

class ReviewApprovalDto {
  @IsString()
  @IsOptional()
  remark?: string;
}

@Controller('system/approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalController {
  constructor(private approvalService: ApprovalService) {}

  @Get()
  @RequirePermission('system:approval')
  async findAll(@Query() query: any, @CurrentUser() user: CurrentUserPayload) {
    return this.approvalService.findAll(query, user);
  }

  @Post()
  @RequirePermission('sale:changeStatus', 'renting:checkout', 'finance:bill:modify', 'system:employee:edit')
  async submit(@Body() dto: SubmitApprovalDto, @CurrentUser() user: CurrentUserPayload) {
    return this.approvalService.submit({
      entityType: dto.entityType,
      entityId: dto.entityId,
      action: dto.action,
      fromStatus: dto.fromStatus,
      toStatus: dto.toStatus,
      operatorId: user.employeeId,
      remark: dto.remark,
    });
  }

  @Post(':id/approve')
  @RequirePermission('system:approval:review')
  @Audit('system', 'approval:approve', { objectType: 'approval_record' })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewApprovalDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.approvalService.approve(id, user, dto.remark);
  }

  @Post(':id/reject')
  @RequirePermission('system:approval:review')
  @Audit('system', 'approval:reject', { objectType: 'approval_record' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewApprovalDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.approvalService.reject(id, user, dto.remark);
  }
}
