import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { BlacklistService } from '../services/blacklist.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';

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
  async check(
    @Query('mobile') mobile?: string,
    @Query('idCard') idCard?: string,
    @Query('name') name?: string,
  ) {
    return this.blacklistService.check(mobile, idCard, name);
  }

  @Post()
  @Audit('house', 'blacklist:create', { objectType: 'blacklist' })
  async create(@Body() data: CreateBlacklistDto, @CurrentUser() user: any) {
    return this.blacklistService.create(data, user);
  }

  @Put(':id')
  @RequirePermission('system:employee:edit')
  @Audit('house', 'blacklist:update', { objectType: 'blacklist' })
  async update(@Param('id') id: string, @Body() data: UpdateBlacklistDto, @CurrentUser() user: any) {
    return this.blacklistService.update(+id, data, user);
  }

  @Delete(':id')
  @RequirePermission('house:blacklist:delete')
  @Audit('house', 'blacklist:delete', { objectType: 'blacklist' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.blacklistService.remove(+id, user);
  }
}
