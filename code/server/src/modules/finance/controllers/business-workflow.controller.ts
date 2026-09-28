import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Audit } from '../../../common/decorators/audit.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { ContractDetails } from '../../house/entities/contract-details';
import { PropertyConfiguration } from '../entities/business-workflow.entity';
import { BusinessWorkflowService } from '../services/business-workflow.service';

class DelegationDto {
  @IsDateString() @Matches(/^\d{4}-\d{2}-\d{2}$/) leaseStart: string;
  @IsDateString() @Matches(/^\d{4}-\d{2}-\d{2}$/) leaseEnd: string;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999999.99)
  amount: number;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  deposit: number;
  @IsString() @MaxLength(50) paymentMethod: string;
  @IsObject() details: ContractDetails;
}
class SettlementDto {
  @IsString() @IsNotEmpty() @MaxLength(100) requestKey: string;
  @IsDateString() @Matches(/^\d{4}-\d{2}-\d{2}$/) paymentDate: string;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999999.99)
  amount: number;
  @IsIn(['bank_ccb', 'bank_rural', 'wechat', 'cash', 'corporate'])
  accountCode: string;
  @IsString() @IsNotEmpty() @MaxLength(100) payerAccount: string;
  @IsString() @IsNotEmpty() @MaxLength(100) payer: string;
  @IsString() @IsNotEmpty() @MaxLength(100) payeeAccount: string;
  @IsString() @IsNotEmpty() @MaxLength(100) payee: string;
}
class ConfigurationDto {
  @IsArray() items: PropertyConfiguration['items'];
}
class OpeningDto {
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) amount: number;
}
class SaleDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
  @IsString() @IsNotEmpty() @MaxLength(255) address: string;
  @IsObject() details: ContractDetails;
}
class SubmissionDto {
  @IsIn(['performance', 'management', 'regular', 'sale']) type: string;
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) period: string;
}
class ReviewDto {
  @IsIn(['save', 'return']) action: string;
  @IsString() @MaxLength(500) note: string;
}

@Controller('finance/business')
export class BusinessWorkflowController {
  constructor(private service: BusinessWorkflowService) {}
  @Post('properties/:id/delegate')
  @RequirePermission('renting:edit')
  @Audit('finance', 'business:delegate')
  delegate(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: DelegationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.delegate(id, input, user);
  }
  @Get('calendar')
  @RequirePermission('finance:arrears')
  calendar(
    @Query('period') period: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.calendar(period, user);
  }
  @Post('schedules/:id/settle')
  @RequirePermission('finance:arrears:modify')
  @Audit('finance', 'business:settle')
  settle(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: SettlementDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.settle(id, input, user);
  }
  @Get('cash-flow')
  @RequirePermission('finance:plan')
  cashFlow(@CurrentUser() user: CurrentUserPayload) {
    return this.service.cashFlow(user);
  }
  @Post('accounts/:code/opening')
  @RequirePermission('finance:plan:modify')
  @Audit('finance', 'business:opening')
  opening(
    @Param('code') code: string,
    @Body() input: OpeningDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.opening(code, input.amount, user);
  }
  @Get('properties/:id/configuration')
  @RequirePermission('house:property_management', 'finance:arrears')
  configuration(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.configuration(id, user);
  }
  @Post('properties/:id/configuration')
  @RequirePermission('renting:edit')
  @Audit('finance', 'business:configuration')
  saveConfiguration(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: ConfigurationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.saveConfiguration(id, input.items, user);
  }
  @Get('performance')
  @RequirePermission('finance:performance')
  performance(
    @Query('period') period: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.performance(period, user);
  }
  @Get('employees')
  @RequirePermission('finance:performance:modify')
  employees(@CurrentUser() user: CurrentUserPayload) {
    return this.service.employeeOptions(user);
  }
  @Post('sales')
  @RequirePermission('finance:performance:modify')
  @Audit('finance', 'business:manual_sale')
  sale(@Body() input: SaleDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.manualSale(input, user);
  }
  @Post('submissions')
  @RequirePermission('finance:performance:modify', 'finance:arrears:modify')
  @Audit('finance', 'business:submit')
  submit(
    @Body() input: SubmissionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.submit(input.type, input.period, user);
  }
  @Get('submissions')
  @RequirePermission(
    'finance:accounting',
    'finance:performance',
    'finance:arrears',
  )
  submissions(@CurrentUser() user: CurrentUserPayload) {
    return this.service.submissions(user);
  }
  @Post('submissions/:id/review')
  @RequirePermission('finance:accounting:modify')
  @Audit('finance', 'business:review')
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: ReviewDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.review(id, input.action, input.note, user);
  }
}
