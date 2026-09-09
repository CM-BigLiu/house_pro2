import { Controller, Get, Post, Body, Put, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ReserveClientService } from '../services/reserve-client.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { SkipMasking } from '../../../common/decorators/skip-masking.decorator';

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

}

class CreateReserveFollowUpDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsIn(['phone', 'visit', 'wechat', 'viewing', 'other'])
  followType: string;

  @IsString()
  @IsOptional()
  status?: string;
}

class ConvertReserveClientDto {
  @IsString()
  @IsNotEmpty()
  contractCode: string;

  @IsDateString()
  @IsOptional()
  contractEndDate?: string;
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
  @RequirePermission('reserve:client:add')
  async create(@Body() data: CreateReserveClientDto, @CurrentUser() user: any) {
    return this.service.create(data, user);
  }

  @Get(':id/edit')
  @RequirePermission('reserve:client:add')
  @SkipMasking()
  async editDetail(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.findOne(id, user);
  }

  @Put(':id')
  @RequirePermission('reserve:client:add')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateReserveClientDto, @CurrentUser() user: any) {
    return this.service.update(id, data, user);
  }

  @Post(':id/follow-ups')
  @RequirePermission('reserve:client:add')
  async addFollowUp(@Param('id', ParseIntPipe) id: number, @Body() data: CreateReserveFollowUpDto, @CurrentUser() user: any) {
    return this.service.addFollowUp(id, data, user);
  }

  @Post(':id/convert')
  @RequirePermission('reserve:client:transfer')
  async convert(@Param('id', ParseIntPipe) id: number, @Body() data: ConvertReserveClientDto, @CurrentUser() user: any) {
    return this.service.convert(id, data, user);
  }
}
