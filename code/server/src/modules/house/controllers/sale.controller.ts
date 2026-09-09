import { Controller, Get, Post, Body, Put, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum, Min, IsInt, Matches, IsEmpty } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/swagger';
import { SkipMasking } from '../../../common/decorators/skip-masking.decorator';
import { SaleStatus } from '../../../common/enums/status.enum';
import { Type } from 'class-transformer';
import { SaleService } from '../services/sale.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';

export class CreateSalePropertyDto {
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
  @IsInt()
  @Min(0)
  layoutRooms: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  layoutHalls: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  layoutBathrooms: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  layoutBalconies: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(0.01)
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
  @IsOptional()
  @Type(() => Number)
  interiorArea?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  totalFloor?: number;

  @IsString()
  @IsOptional()
  propertyStatus?: string;

  @IsBoolean()
  @IsOptional()
  isRentSaleCoexist?: boolean;

  @IsBoolean()
  @IsOptional()
  isFusion?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsString()
  @IsOptional()
  govVerifyCode?: string;

  @IsString()
  @IsOptional()
  govVerifyStatus?: string;

  @IsString()
  @IsOptional()
  quickSaleStart?: string;

  @IsString()
  @IsOptional()
  quickSaleEnd?: string;

  @IsString()
  @IsOptional()
  publishedAt?: string;

  @IsString()
  @IsOptional()
  offShelfAt?: string;

  @IsString()
  @IsOptional()
  bargainAt?: string;

  @IsString()
  @IsOptional()
  verifiedAt?: string;

  @IsString()
  @IsOptional()
  lastFollowAt?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  daysWithoutFollow?: number;

  @IsString()
  @IsOptional()
  viewingTime?: string;

  @IsString()
  @IsOptional()
  viewingTimeAlt?: string;

  @IsString()
  @IsOptional()
  vrUrl?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(0.01)
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
  @IsOptional()
  ownerIdCard?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^1\d{10}$/, { message: '业主电话须为 11 位手机号' })
  ownerPhone: string;

  @IsString()
  @IsOptional()
  ownerPhoneBackup?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maintainerId?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  storeId?: number;

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

export class UpdateSalePropertyDto extends PartialType(OmitType(CreateSalePropertyDto, ['code', 'storeId'] as const)) {
  @IsEmpty({ message: '请使用独立状态变更接口' })
  status?: never;
}

export class ChangeSaleStatusDto {
  @IsEnum(SaleStatus)
  status: SaleStatus;
}

@Controller('house/sale-properties')
@UseGuards(JwtAuthGuard)
export class SaleController {
  constructor(
    private saleService: SaleService,
  ) {}

  @Get()
  @RequirePermission('house:sale')
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.saleService.findAll(query, user);
  }

  @Get('export')
  @RequirePermission('sale:export')
  async exportPage(@Query() query: any, @CurrentUser() user: any) {
    return this.saleService.findAll(query, user);
  }

  @Get(':id/edit')
  @RequirePermission('sale:edit')
  @SkipMasking()
  async editDetail(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.saleService.findOne(id, user);
  }

  @Put(':id/status')
  @RequirePermission('sale:changeStatus')
  @Audit('house', 'sale:changeStatus', { objectType: 'sale_property' })
  async changeStatus(@Param('id', ParseIntPipe) id: number, @Body() data: ChangeSaleStatusDto, @CurrentUser() user: any) {
    return this.saleService.changeStatus(id, data.status, user);
  }

  @Get(':id')
  @RequirePermission('house:sale')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.saleService.findOne(+id, user);
  }

  @Post()
  @RequirePermission('sale:add')
  @Audit('house', 'sale:create', { objectType: 'sale_property' })
  async create(@Body() data: CreateSalePropertyDto, @CurrentUser() user: any) {
    return this.saleService.create(data, user);
  }

  @Put(':id')
  @RequirePermission('sale:edit')
  @Audit('house', 'sale:update', { objectType: 'sale_property' })
  async update(@Param('id') id: string, @Body() data: UpdateSalePropertyDto, @CurrentUser() user: any) {
    return this.saleService.update(+id, data, user);
  }
}
