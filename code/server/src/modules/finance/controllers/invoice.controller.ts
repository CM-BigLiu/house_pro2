import { Controller, Get, Post, Body, Put, Param, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceService } from '../services/invoice.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';

class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  applySource: string;

  @IsString()
  @IsNotEmpty()
  buyerName: string;

  @IsString()
  @IsOptional()
  buyerTaxNo?: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  amountWithoutTax: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  taxAmount: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  amountWithTax: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsString()
  @IsOptional()
  issuer?: string;
}

class UpdateInvoiceDto {
  @IsString()
  @IsOptional()
  applySource?: string;

  @IsString()
  @IsOptional()
  buyerName?: string;

  @IsString()
  @IsOptional()
  buyerTaxNo?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  amountWithoutTax?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  taxAmount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  amountWithTax?: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsString()
  @IsOptional()
  issuer?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

@Controller('finance/invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.invoiceService.findAll(query);
  }

  @Post()
  @Audit('finance', 'invoice:create', { objectType: 'invoice' })
  async create(@Body() data: CreateInvoiceDto, @CurrentUser() user: any) {
    return this.invoiceService.create(data, user);
  }

  @Put(':id')
  @Audit('finance', 'invoice:update', { objectType: 'invoice' })
  async update(@Param('id') id: string, @Body() data: UpdateInvoiceDto, @CurrentUser() user: any) {
    return this.invoiceService.update(+id, data, user);
  }
}
