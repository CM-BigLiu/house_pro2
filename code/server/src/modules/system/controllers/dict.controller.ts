import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { DictService } from '../services/dict.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

class CreateDictItemDto {
  @IsString()
  @IsNotEmpty()
  dictCode: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sort?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

class UpdateDictItemDto {
  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sort?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

@Controller('system/dicts')
@UseGuards(JwtAuthGuard)
export class DictController {
  constructor(private dictService: DictService) {}

  @Get()
  async findAll() {
    return this.dictService.findAll();
  }

  @Get(':code/items')
  async findItems(@Param('code') code: string) {
    return this.dictService.findItems(code);
  }

  @Post('items')
  async createItem(@Body() data: CreateDictItemDto) {
    return this.dictService.createItem(data);
  }

  @Put('items/:id')
  async updateItem(@Param('id') id: string, @Body() data: UpdateDictItemDto) {
    return this.dictService.updateItem(+id, data);
  }

  @Delete('items/:id')
  async removeItem(@Param('id') id: string) {
    return this.dictService.removeItem(+id);
  }
}
