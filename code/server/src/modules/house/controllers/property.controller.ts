import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { SaleService } from '../services/sale.service';
import { RentalService } from '../services/rental.service';
import { BlacklistService } from '../services/blacklist.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';

class UnifiedPropertyQueryDto {}

class UnifiedPropertyCreateDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  transType: number; // 1 rental, 2 sale, 3 reserve

  // Sale fields
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  propertyType?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  communityId?: number;

  @IsString()
  @IsOptional()
  building?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsOptional()
  roomNo?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  salePrice?: number;

  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @IsString()
  @IsOptional()
  ownerIdCard?: string;

  // Rental fields
  @IsString()
  @IsOptional()
  bizType?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  layout?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  storeId?: number;

  @IsArray()
  @IsOptional()
  rooms?: any[];

  @IsString()
  @IsOptional()
  tenantLeaseStart?: string;

  @IsString()
  @IsOptional()
  tenantLeaseEnd?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  rent?: number;
}

@Controller('property')
@UseGuards(JwtAuthGuard)
export class PropertyController {
  constructor(
    private saleService: SaleService,
    private rentalService: RentalService,
    private blacklistService: BlacklistService,
  ) {}

  @Get('page')
  async page(@Query() query: any, @CurrentUser() user: any) {
    const transType = Number(query.transType || 2);
    if (transType === 1) {
      return this.rentalService.findSets(query, user);
    }
    if (transType === 2) {
      return this.saleService.findAll(query, user);
    }
    throw new BadRequestException('不支持的 transType');
  }

  @Post('add')
  @RequirePermission('sale:add')
  @Audit('house', 'property:create', { objectType: 'property' })
  async add(@Body() data: UnifiedPropertyCreateDto, @CurrentUser() user: any) {
    const transType = Number(data.transType || 2);
    if (transType === 1) {
      return this.rentalService.createSet(data, user);
    }
    if (transType === 2) {
      const hits = await this.blacklistService.check(
        data.ownerPhone,
        data.ownerIdCard,
        data.ownerName,
      );
      if (hits.length) {
        throw new BadRequestException(
          `命中黑名单：${hits.map((h) => `${h.name}(${h.mobile})`).join(', ')}`,
        );
      }
      return this.saleService.create(data, user);
    }
    throw new BadRequestException('不支持的 transType');
  }

  @Get('detail/:id')
  async detail(@Param('id') id: string, @Query('transType') transType: string, @CurrentUser() user: any) {
    const type = Number(transType || 2);
    if (type === 2) {
      return this.saleService.findOne(+id, user);
    }
    throw new BadRequestException('不支持的 transType');
  }

  @Put('update/:id')
  @RequirePermission('sale:edit')
  @Audit('house', 'property:update', { objectType: 'property' })
  async update(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    const transType = Number(data.transType || 2);
    if (transType === 2) {
      return this.saleService.update(+id, data, user);
    }
    throw new BadRequestException('不支持的 transType');
  }
}
