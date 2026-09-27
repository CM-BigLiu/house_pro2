import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';
import { SignRentalAppointmentDto } from './rental-appointment.controller';
import { CustomerWorkflowService } from '../services/customer-workflow.service';

class CustomerAppointmentDto {
  @Type(() => Number) @IsInt() @Min(1) propertyId: number;
  @IsDateString() scheduledAt: string;
  @IsOptional() @IsString() @MaxLength(500) remark?: string;
}
class CustomerSignDto extends PartialType(SignRentalAppointmentDto) {
  @Type(() => Number) @IsInt() @Min(1) appointmentId: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(999999999999.99) amount?: number;
}
class TerminateDto {
  @Type(() => Number) @IsInt() @Min(1) dealId: number;
  @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) terminatedOn: string;
  @IsString() @IsNotEmpty() @MaxLength(255) reason: string;
}
export class DealQueryDto {
  @IsOptional() @IsIn(['rent', 'sale']) bizType?: string;
  @IsOptional() @IsIn(['active', 'termination_pending', 'terminated']) status?: string;
  @IsOptional() @IsString() @MaxLength(100) keyword?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) customerId?: number;
  @IsOptional() @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) startDate?: string;
  @IsOptional() @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) endDate?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}

@Controller('house/customers/:customerId/workflow')
export class CustomerWorkflowController {
  constructor(private workflow: CustomerWorkflowService) {}
  @Get('context')
  @RequirePermission('house:customer:appointment', 'house:customer:sign', 'house:customer:terminate')
  context(@Param('customerId', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) { return this.workflow.context(id, user); }
  @Get('properties')
  @RequirePermission('house:customer:appointment')
  properties(@Param('customerId', ParseIntPipe) id: number, @Query() query: DealQueryDto, @CurrentUser() user: CurrentUserPayload) { return this.workflow.propertyOptions(id, query, user); }
  @Get('appointments/:id/signing-context')
  @RequirePermission('house:customer:sign')
  signingContext(@Param('customerId', ParseIntPipe) customerId: number, @Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) { return this.workflow.signingContext(customerId, id, user); }
  @Post('appointments')
  @RequirePermission('house:customer:appointment')
  @Audit('house', 'customer:appointment', { objectType: 'customer' })
  appointment(@Param('customerId', ParseIntPipe) id: number, @Body() data: CustomerAppointmentDto, @CurrentUser() user: CurrentUserPayload) { return this.workflow.createAppointment(id, data, user); }
  @Post('sign')
  @RequirePermission('house:customer:sign')
  @Audit('house', 'customer:sign', { objectType: 'customer' })
  sign(@Param('customerId', ParseIntPipe) id: number, @Body() data: CustomerSignDto, @CurrentUser() user: CurrentUserPayload) { return this.workflow.sign(id, data, user); }
  @Post('terminate')
  @RequirePermission('house:customer:terminate')
  @Audit('house', 'customer:terminate', { objectType: 'customer' })
  terminate(@Param('customerId', ParseIntPipe) id: number, @Body() data: TerminateDto, @CurrentUser() user: CurrentUserPayload) { return this.workflow.terminate(id, data.dealId, data, user); }
}

@Controller('finance/deals')
export class DealsController {
  constructor(private workflow: CustomerWorkflowService) {}
  @Get()
  @RequirePermission('finance:deal')
  findAll(@Query() query: DealQueryDto, @CurrentUser() user: CurrentUserPayload) { return this.workflow.findDeals(query, user); }
}
