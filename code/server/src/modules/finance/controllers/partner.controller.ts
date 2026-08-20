import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PartnerService } from '../services/partner.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class CreatePartnerDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  storeId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  share?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  invest?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  profit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  dividend?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

class UpdatePartnerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  share?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  invest?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  profit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  dividend?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

@Controller('finance/partners')
@UseGuards(JwtAuthGuard)
export class PartnerController {
  constructor(private service: PartnerService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Post()
  async create(@Body() data: CreatePartnerDto) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdatePartnerDto) {
    return this.service.update(+id, data);
  }
}
