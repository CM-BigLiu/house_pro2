import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { FlowService } from '../services/flow.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class CreateFlowDto {
  @IsString()
  @IsNotEmpty()
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
}

@Controller('finance/flows')
@UseGuards(JwtAuthGuard)
export class FlowController {
  constructor(private flowService: FlowService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.flowService.findAll(query, user);
  }

  @Post()
  async create(@Body() data: CreateFlowDto) {
    return this.flowService.create(data);
  }
}
