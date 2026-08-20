import { Controller, Get, Post, Body, Put, Param, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleService } from '../services/role.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  dataScope?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Type(() => Number)
  permissionIds?: number[];
}

class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  dataScope?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Type(() => Number)
  permissionIds?: number[];
}

@Controller('system/roles')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private roleService: RoleService) {}

  @Get()
  async findAll() {
    return this.roleService.findAll();
  }

  @Post()
  async create(@Body() data: CreateRoleDto) {
    return this.roleService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateRoleDto) {
    return this.roleService.update(+id, data);
  }
}
