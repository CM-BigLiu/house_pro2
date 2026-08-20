import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ReserveService } from '../services/reserve.service';
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

@Controller('house/reserves')
@UseGuards(JwtAuthGuard)
export class ReserveController {
  constructor(private reserveService: ReserveService) {}

  @Get('properties')
  async properties(@Query() query: any, @CurrentUser() user: any) {
    return this.reserveService.findProperties(query, user);
  }

  @Post('properties')
  async createProperty(@Body() data: CreateReservePropertyDto) {
    return this.reserveService.createProperty(data);
  }

  @Get('clients')
  async clients(@Query() query: any, @CurrentUser() user: any) {
    return this.reserveService.findClients(query, user);
  }

  @Post('clients')
  async createClient(@Body() data: CreateReserveClientDto) {
    return this.reserveService.createClient(data);
  }
}
