import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ReservePropertyService } from '../services/reserve-property.service';
import { ReserveClientService } from '../services/reserve-client.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class CreateReserveHouseDto {
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

class UpdateReserveHouseDto {
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() roomNo?: string;
  @IsString() @IsOptional() layout?: string;
  @IsNumber() @IsOptional() @Type(() => Number) buildingArea?: number;
  @IsString() @IsOptional() decoration?: string;
  @IsString() @IsOptional() ownerName?: string;
  @IsString() @IsOptional() ownerPhone?: string;
  @IsNumber() @IsOptional() @Type(() => Number) ownerQuote?: number;
  @IsString() @IsOptional() sourceChannel?: string;
  @IsString() @IsOptional() keyStatus?: string;
  @IsString() @IsOptional() diskType?: string;
  @IsString() @IsOptional() status?: string;
  @IsNumber() @IsOptional() @Type(() => Number) salesmanId?: number;
  @IsNumber() @IsOptional() @Type(() => Number) followerId?: number;
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

class UpdateReserveClientDto {
  @IsString() @IsOptional() clientName?: string;
  @IsString() @IsOptional() clientMobile?: string;
  @IsString() @IsOptional() desiredLocation?: string;
  @IsString() @IsOptional() demandType?: string;
  @IsString() @IsOptional() desiredLayout?: string;
  @IsNumber() @IsOptional() @Type(() => Number) areaMin?: number;
  @IsNumber() @IsOptional() @Type(() => Number) areaMax?: number;
  @IsNumber() @IsOptional() @Type(() => Number) priceMin?: number;
  @IsNumber() @IsOptional() @Type(() => Number) priceMax?: number;
  @IsString() @IsOptional() sourceChannel?: string;
  @IsString() @IsOptional() usage?: string;
  @IsString() @IsOptional() urgency?: string;
  @IsString() @IsOptional() ownership?: string;
  @IsString() @IsOptional() status?: string;
  @IsNumber() @IsOptional() @Type(() => Number) salesmanId?: number;
  @IsNumber() @IsOptional() @Type(() => Number) followerId?: number;
}

@Controller('reserve')
@UseGuards(JwtAuthGuard)
export class ReserveAliasController {
  constructor(
    private propertyService: ReservePropertyService,
    private clientService: ReserveClientService,
  ) {}

  @Get('house/page')
  async housePage(@Query() query: any, @CurrentUser() user: any) {
    return this.propertyService.findAll(query, user);
  }

  @Post('house/add')
  async houseAdd(@Body() data: CreateReserveHouseDto) {
    return this.propertyService.create(data);
  }

  @Put('house/update/:id')
  async houseUpdate(@Param('id') id: string, @Body() data: UpdateReserveHouseDto) {
    return this.propertyService.update(+id, data);
  }

  @Get('client/page')
  async clientPage(@Query() query: any, @CurrentUser() user: any) {
    return this.clientService.findAll(query, user);
  }

  @Post('client/add')
  async clientAdd(@Body() data: CreateReserveClientDto) {
    return this.clientService.create(data);
  }

  @Put('client/update/:id')
  async clientUpdate(@Param('id') id: string, @Body() data: UpdateReserveClientDto) {
    return this.clientService.update(+id, data);
  }
}
