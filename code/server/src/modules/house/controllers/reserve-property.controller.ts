import { Controller, Get, Post, Body, Put, Param, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ReservePropertyService } from '../services/reserve-property.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class CreateReservePropertyDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  storeId: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  groupId?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  communityId?: number;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  roomNo: string;

  @IsString()
  @IsNotEmpty()
  layout: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  buildingArea?: number;

  @IsString()
  @IsOptional()
  decoration?: string;

  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  ownerQuote?: number;

  @IsString()
  @IsNotEmpty()
  sourceChannel: string;

  @IsString()
  @IsOptional()
  keyStatus?: string;

  @IsString()
  @IsOptional()
  diskType?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  salesmanId?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  followerId?: number;

  @IsString()
  @IsOptional()
  followDate?: string;
}

class UpdateReservePropertyDto {
  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  roomNo?: string;

  @IsString()
  @IsOptional()
  layout?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  buildingArea?: number;

  @IsString()
  @IsOptional()
  decoration?: string;

  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  ownerQuote?: number;

  @IsString()
  @IsOptional()
  sourceChannel?: string;

  @IsString()
  @IsOptional()
  keyStatus?: string;

  @IsString()
  @IsOptional()
  diskType?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  salesmanId?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  followerId?: number;
}

@Controller('house/reserve-properties')
@UseGuards(JwtAuthGuard)
export class ReservePropertyController {
  constructor(private service: ReservePropertyService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Post()
  async create(@Body() data: CreateReservePropertyDto) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateReservePropertyDto) {
    return this.service.update(+id, data);
  }
}
