import { Controller, Get, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { PropertyManagementService } from '../services/property-management.service';

export class PropertyManagementQueryDto {
  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  page = 1;

  @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
  pageSize = 20;

  @IsOptional() @IsString() @MaxLength(100)
  keyword?: string;
}

@Controller('house/property-management')
@RequirePermission('house:property_management')
export class PropertyManagementController {
  constructor(private readonly service: PropertyManagementService) {}

  @Get('properties')
  properties(@Query() query: PropertyManagementQueryDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.properties(query, user);
  }

  @Get('tenants')
  tenants(@Query() query: PropertyManagementQueryDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.tenants(query, user);
  }
}
