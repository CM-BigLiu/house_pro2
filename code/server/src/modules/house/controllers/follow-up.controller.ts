import { Controller, Get, Post, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { FollowUpService } from '../services/follow-up.service';
import { OperationLogService } from '../services/operation-log.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

class CreateFollowUpDto {
  @IsString()
  @IsNotEmpty()
  bizType: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  bizId: number;

  @IsString()
  @IsNotEmpty()
  followType: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  status?: string;
}

@Controller('house/follow-ups')
@UseGuards(JwtAuthGuard)
export class FollowUpController {
  constructor(
    private followUpService: FollowUpService,
    private operationLogService: OperationLogService,
  ) {}

  @Get()
  async findByBiz(
    @Query('bizType') bizType: string,
    @Query('bizId') bizId: string,
    @CurrentUser() user: any,
  ) {
    const id = Number(bizId);
    if (!bizType || !Number.isFinite(id)) {
      return [];
    }
    return this.followUpService.findByBiz(bizType, id, user);
  }

  @Post()
  @RequirePermission('reserve:client:add')
  async create(@Body() data: CreateFollowUpDto, @CurrentUser() user: any) {
    const item = await this.followUpService.create(data, user);
    await this.operationLogService.log(user, 'house', 'follow_up_create', data.bizType, String(data.bizId), data.content);
    return item;
  }
}

@Controller('house/operation-logs')
@UseGuards(JwtAuthGuard)
export class OperationLogController {
  constructor(private operationLogService: OperationLogService) {}

  @Get()
  async findByBiz(
    @Query('bizType') bizType: string,
    @Query('bizId') bizId: string,
    @CurrentUser() user: any,
  ) {
    return this.operationLogService.findByBiz(bizType, bizId, user);
  }
}
