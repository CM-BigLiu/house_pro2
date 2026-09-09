import { Controller, Get, Post, Body, Put, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { CommunityService } from '../services/community.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

class CreateCommunityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  alias?: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  cityId: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  districtId?: number;

  @IsString()
  @IsOptional()
  businessCircle?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;
}

class UpdateCommunityDto extends PartialType(CreateCommunityDto) {}

@Controller('house/communities')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.communityService.findAll(query, user);
  }

  @Get('filters')
  async filters() {
    return this.communityService.filters();
  }

  @Post()
  @RequirePermission('house:community:create')
  async create(@Body() data: CreateCommunityDto) {
    return this.communityService.create(data);
  }

  @Get(':id/buildings')
  async buildings(@Param('id') id: string) {
    return this.communityService.findBuildings(+id);
  }

  @Get('units')
  async units(@Query('buildingId') buildingId: string) {
    return this.communityService.findUnits(+buildingId);
  }

  @Get('floors')
  async floors(@Query('unitId') unitId: string) {
    return this.communityService.findFloors(+unitId);
  }

  @Get('rooms')
  async rooms(@Query('floorId') floorId: string) {
    return this.communityService.findRooms(+floorId);
  }

  @Get(':id')
  @RequirePermission('house:community:edit')
  async findOne(@Param('id') id: string) {
    return this.communityService.findOne(+id);
  }

  @Put(':id')
  @RequirePermission('house:community:edit')
  async update(@Param('id') id: string, @Body() data: UpdateCommunityDto) {
    return this.communityService.update(+id, data);
  }

  @Delete(':id')
  @RequirePermission('house:community:delete')
  async remove(@Param('id') id: string) {
    return this.communityService.remove(+id);
  }
}

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityAliasController {
  constructor(private communityService: CommunityService) {}

  @Get()
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.communityService.findAll(query, user);
  }

  @Get('filters')
  async filters() {
    return this.communityService.filters();
  }

  @Post()
  @RequirePermission('house:community:create')
  async create(@Body() data: CreateCommunityDto) {
    return this.communityService.create(data);
  }

  @Get(':id/buildings')
  async buildings(@Param('id') id: string) {
    return this.communityService.findBuildings(+id);
  }

  @Get('units')
  async units(@Query('buildingId') buildingId: string) {
    return this.communityService.findUnits(+buildingId);
  }

  @Get('floors')
  async floors(@Query('unitId') unitId: string) {
    return this.communityService.findFloors(+unitId);
  }

  @Get('rooms')
  async rooms(@Query('floorId') floorId: string) {
    return this.communityService.findRooms(+floorId);
  }

  @Get(':id')
  @RequirePermission('house:community:edit')
  async findOne(@Param('id') id: string) {
    return this.communityService.findOne(+id);
  }

  @Put(':id')
  @RequirePermission('house:community:edit')
  async update(@Param('id') id: string, @Body() data: UpdateCommunityDto) {
    return this.communityService.update(+id, data);
  }

  @Delete(':id')
  @RequirePermission('house:community:delete')
  async remove(@Param('id') id: string) {
    return this.communityService.remove(+id);
  }
}
