import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { RentIncreaseService } from '../services/rent-increase.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class CreateRentIncreaseDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  storeId: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  roomId?: number;

  @IsString()
  @IsOptional()
  roomCode?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  year?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  month?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  lastRent?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  currentRent?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  increaseAmount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  increaseRate?: number;
}

@Controller('finance/rent-increases')
@UseGuards(JwtAuthGuard)
export class RentIncreaseController {
  constructor(private service: RentIncreaseService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Post()
  async create(@Body() data: CreateRentIncreaseDto) {
    return this.service.create(data);
  }
}
