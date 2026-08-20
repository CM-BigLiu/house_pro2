import { Controller, Get, Post, Body, Put, Param, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ReserveClientService } from '../services/reserve-client.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class CreateReserveClientDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  storeId: number;

  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsString()
  @IsOptional()
  clientMobile?: string;

  @IsString()
  @IsOptional()
  desiredLocation?: string;

  @IsString()
  @IsNotEmpty()
  demandType: string;

  @IsString()
  @IsOptional()
  desiredLayout?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  areaMin?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  areaMax?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  priceMin?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  priceMax?: number;

  @IsString()
  @IsOptional()
  sourceChannel?: string;

  @IsString()
  @IsOptional()
  usage?: string;

  @IsString()
  @IsOptional()
  urgency?: string;

  @IsString()
  @IsOptional()
  ownership?: string;

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

class UpdateReserveClientDto {
  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsOptional()
  clientMobile?: string;

  @IsString()
  @IsOptional()
  desiredLocation?: string;

  @IsString()
  @IsOptional()
  demandType?: string;

  @IsString()
  @IsOptional()
  desiredLayout?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  areaMin?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  areaMax?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  priceMin?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  priceMax?: number;

  @IsString()
  @IsOptional()
  sourceChannel?: string;

  @IsString()
  @IsOptional()
  usage?: string;

  @IsString()
  @IsOptional()
  urgency?: string;

  @IsString()
  @IsOptional()
  ownership?: string;

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

@Controller('house/reserve-clients')
@UseGuards(JwtAuthGuard)
export class ReserveClientController {
  constructor(private service: ReserveClientService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Post()
  async create(@Body() data: CreateReserveClientDto) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateReserveClientDto) {
    return this.service.update(+id, data);
  }
}
