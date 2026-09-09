import { Controller, Get, Post, Body, Query, UseGuards, Put, Param, ParseIntPipe } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { FlowService } from '../services/flow.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { PartialType } from '@nestjs/swagger';
import { Audit } from '../../../common/decorators/audit.decorator';

class CreateFlowDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['income', 'expense'])
  direction: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  paymentType?: string;

  @IsString()
  @IsOptional()
  bizType?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsBoolean()
  @IsOptional()
  isRed?: boolean;

  @IsDateString()
  @IsOptional()
  occurredOn?: string;
}

class UpdateFlowDto extends PartialType(CreateFlowDto) {}

@Controller('finance/flows')
@UseGuards(JwtAuthGuard)
export class FlowController {
  constructor(private flowService: FlowService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.flowService.findAll(query, user);
  }

  @Get(':id/edit')
  @RequirePermission('finance:flow:modify')
  async editDetail(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.flowService.findOne(id, user);
  }

  @Post()
  @RequirePermission('finance:flow:modify')
  @Audit('finance', 'flow:create', { objectType: 'finance_flow' })
  async create(@Body() data: CreateFlowDto, @CurrentUser() user: any) {
    return this.flowService.create(data, user);
  }

  @Put(':id')
  @RequirePermission('finance:flow:modify')
  @Audit('finance', 'flow:update', { objectType: 'finance_flow' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateFlowDto, @CurrentUser() user: any) {
    return this.flowService.update(id, data, user);
  }
}
