import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { BlacklistService } from '../services/blacklist.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class CreateBlacklistDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  idCard?: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  storeId?: number;
}

class UpdateBlacklistDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  idCard?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

@Controller('house/blacklist')
@UseGuards(JwtAuthGuard)
export class BlacklistController {
  constructor(private blacklistService: BlacklistService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.blacklistService.findAll(query, user);
  }

  @Get('check')
  async check(@Query('mobile') mobile?: string, @Query('idCard') idCard?: string) {
    return this.blacklistService.check(mobile, idCard);
  }

  @Post()
  async create(@Body() data: CreateBlacklistDto) {
    return this.blacklistService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateBlacklistDto) {
    return this.blacklistService.update(+id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.blacklistService.remove(+id);
  }
}
