import { Controller, Get, Post, Body, Put, Param, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleService } from '../services/role.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';

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
  @RequirePermission('system:role:create')
  @Audit('system', 'role:create', { objectType: 'role' })
  async create(@Body() data: CreateRoleDto) {
    return this.roleService.create(data);
  }

  @Put(':id')
  @RequirePermission('system:role:edit')
  @Audit('system', 'role:update', { objectType: 'role' })
  async update(@Param('id') id: string, @Body() data: UpdateRoleDto) {
    return this.roleService.update(+id, data);
  }
}
