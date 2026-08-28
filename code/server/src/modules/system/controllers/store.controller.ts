import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { StoreService } from '../services/store.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';

class CreateStoreDto {
  @IsString()
  name: string;

  @IsNumber()
  @Type(() => Number)
  cityId: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  manager?: string;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}

@Controller('system/stores')
@UseGuards(JwtAuthGuard)
export class StoreController {
  constructor(private storeService: StoreService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.storeService.findAll(query);
  }

  @Post()
  @RequirePermission('system:store:edit')
  @Audit('system', 'store:create', { objectType: 'store' })
  async create(@Body() dto: CreateStoreDto) {
    return this.storeService.create(dto);
  }

  @Put(':id')
  @RequirePermission('system:store:edit')
  @Audit('system', 'store:update', { objectType: 'store' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateStoreDto>) {
    return this.storeService.update(+id, dto);
  }

  @Delete(':id')
  @RequirePermission('system:store:edit')
  @Audit('system', 'store:delete', { objectType: 'store' })
  async remove(@Param('id') id: string) {
    await this.storeService.remove(+id);
    return { id: +id };
  }
}
