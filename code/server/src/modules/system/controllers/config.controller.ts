import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ConfigService } from '../services/config.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

class ConfigItemDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @IsString()
  @IsOptional()
  configKey?: string;

  @IsString()
  @IsOptional()
  configValue?: string;
}

class BatchConfigDto {
  @IsArray()
  configs: ConfigItemDto[];
}

@Controller('system/configs')
@UseGuards(JwtAuthGuard)
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Get()
  async findAll(@Query('group') group?: string) {
    return this.configService.findByGroup(group);
  }

  @Post('batch')
  async batchUpdate(@Body() data: BatchConfigDto) {
    return this.configService.batchUpdate(data?.configs || []);
  }
}
