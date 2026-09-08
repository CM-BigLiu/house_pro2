import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SystemLogService } from '../services/system-log.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('system/logs')
@UseGuards(JwtAuthGuard)
export class LogController {
  constructor(private systemLogService: SystemLogService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.systemLogService.findAll(query);
  }
}
