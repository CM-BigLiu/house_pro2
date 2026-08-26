import { Controller, Get, Post, Body, Put, Param, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { SaleService } from '../services/sale.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

class CreateSalePropertyDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  propertyType: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  communityId: number;

  @IsString()
  @IsNotEmpty()
  building: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsString()
  @IsNotEmpty()
  floor: string;

  @IsString()
  @IsNotEmpty()
  roomNo: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  layoutRooms: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  layoutHalls: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  layoutBathrooms: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  layoutBalconies: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  buildingArea: number;

  @IsString()
  @IsNotEmpty()
  orientation: string;

  @IsString()
  @IsNotEmpty()
  decoration: string;

  @IsString()
  @IsNotEmpty()
  elevator: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  buildYear?: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  salePrice: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  unitPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  floorPrice?: number;

  @IsString()
  @IsOptional()
  taxType?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  debt?: number;

  @IsString()
  @IsOptional()
  certificateType?: string;

  @IsString()
  @IsNotEmpty()
  sourceChannel: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @IsString()
  @IsNotEmpty()
  ownerPhone: string;

  @IsString()
  @IsOptional()
  ownerPhoneBackup?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maintainerId?: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  storeId: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  qualityScore?: number;

  @IsString()
  @IsOptional()
  qualityLevel?: string;

  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @IsBoolean()
  @IsOptional()
  isCitywideSale?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

class UpdateSalePropertyDto {
  @IsString()
  @IsOptional()
  propertyType?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  salePrice?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maintainerId?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  qualityScore?: number;

  @IsString()
  @IsOptional()
  qualityLevel?: string;

  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @IsBoolean()
  @IsOptional()
  isCitywideSale?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

@Controller('house/sale-properties')
@UseGuards(JwtAuthGuard)
export class SaleController {
  constructor(private saleService: SaleService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.saleService.findAll(query, user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.saleService.findOne(+id, user);
  }

  @Post()
  @RequirePermission('sale:add')
  async create(@Body() data: CreateSalePropertyDto, @CurrentUser() user: any) {
    return this.saleService.create(data, user);
  }

  @Put(':id')
  @RequirePermission('sale:edit')
  async update(@Param('id') id: string, @Body() data: UpdateSalePropertyDto, @CurrentUser() user: any) {
    return this.saleService.update(+id, data, user);
  }
}
