import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { ContractDetails } from '../entities/contract-details';
import { Audit } from '../../../common/decorators/audit.decorator';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { RentalAppointmentService } from '../services/rental-appointment.service';

class CreateRentalAppointmentDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  rentalSetId: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  rentalRoomId?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  customerId?: number;

  @IsDateString()
  scheduledAt: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  remark?: string;
}

export class FollowUpRentalAppointmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content: string;
}

export class SignRentalAppointmentDto {
  @IsOptional() @IsObject() details?: ContractDetails;
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  rentalRoomId?: number;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  contractCode?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  tenantName?: string;

  @Matches(/^1\d{10}$/)
  @IsOptional()
  tenantPhone?: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  leaseStart: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  leaseEnd: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  rent: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  deposit: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  paymentMethod: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  remark?: string;
}

@Controller('house/rental-appointments')
export class RentalAppointmentController {
  constructor(private appointmentService: RentalAppointmentService) {}

  @Get()
  @RequirePermission('renting:appointment:view')
  async findAll(@Query() query: any, @CurrentUser() user: CurrentUserPayload) {
    return this.appointmentService.findAll(query, user);
  }

  @Post()
  @RequirePermission('renting:appointment:create')
  @Audit('house', 'rental_appointment:create', { objectType: 'rental_appointment' })
  async create(@Body() data: CreateRentalAppointmentDto, @CurrentUser() user: CurrentUserPayload) {
    return this.appointmentService.create(data, user);
  }

  @Post(':id/follow-up')
  @RequirePermission('renting:appointment:follow-up')
  @Audit('house', 'rental_appointment:follow_up', { objectType: 'rental_appointment' })
  followUp(@Param('id', ParseIntPipe) id: number, @Body() data: FollowUpRentalAppointmentDto, @CurrentUser() user: CurrentUserPayload) {
    return this.appointmentService.followUp(id, data.content, user);
  }

  @Get(':id/signing-context')
  @RequirePermission('renting:appointment:sign')
  signingContext(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.appointmentService.signingContext(id, user);
  }

  @Post(':id/sign')
  @RequirePermission('renting:appointment:sign')
  @Audit('house', 'rental_appointment:sign', { objectType: 'rental_appointment' })
  sign(@Param('id', ParseIntPipe) id: number, @Body() data: SignRentalAppointmentDto, @CurrentUser() user: CurrentUserPayload) {
    return this.appointmentService.sign(id, data, user);
  }

  @Post(':id/recommend')
  @RequirePermission('renting:appointment:recommend')
  @Audit('house', 'rental_appointment:recommend', { objectType: 'rental_appointment' })
  recommend(@Param('id', ParseIntPipe) id: number, @Body() data: CreateRentalAppointmentDto, @CurrentUser() user: CurrentUserPayload) {
    return this.appointmentService.recommend(id, data, user);
  }
}
