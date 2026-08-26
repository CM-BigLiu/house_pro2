import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApprovalService } from '../services/approval.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

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
  async findByEntity(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    return this.approvalService.findByEntity(entityType, +entityId);
  }

  @Post()
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
  async approve(
    @Param('id') id: string,
    @Body() dto: ReviewApprovalDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.approvalService.approve(+id, user.employeeId, dto.remark);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() dto: ReviewApprovalDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.approvalService.reject(+id, user.employeeId, dto.remark);
  }
}
