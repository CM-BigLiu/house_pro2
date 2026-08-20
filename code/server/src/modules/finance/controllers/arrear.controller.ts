import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ArrearService } from '../services/arrear.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

class CreateArrearDto {
  @IsString()
  @IsNotEmpty()
  bizType: string;

  @IsString()
  @IsNotEmpty()
  personType: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  totalAmount: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  remainAmount?: number;

  @IsString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

@Controller('finance/arrears')
@UseGuards(JwtAuthGuard)
export class ArrearController {
  constructor(private arrearService: ArrearService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.arrearService.findAll(query);
  }

  @Post()
  async create(@Body() data: CreateArrearDto) {
    return this.arrearService.create(data);
  }
}
