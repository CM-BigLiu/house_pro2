import { Controller, Get, Post, Body, Put, Param, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { EmployeeService } from '../services/employee.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Audit } from '../../../common/decorators/audit.decorator';

class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Type(() => Number)
  roleIds?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Type(() => Number)
  storeIds?: number[];
}

class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Type(() => Number)
  roleIds?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Type(() => Number)
  storeIds?: number[];
}

@Controller('system/employees')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.employeeService.findAll(query);
  }

  @Post()
  @Audit('system', 'employee:create', { objectType: 'employee' })
  async create(@Body() data: CreateEmployeeDto) {
    return this.employeeService.create(data);
  }

  @Put(':id')
  @Audit('system', 'employee:update', { objectType: 'employee' })
  async update(@Param('id') id: string, @Body() data: UpdateEmployeeDto) {
    return this.employeeService.update(+id, data);
  }
}
