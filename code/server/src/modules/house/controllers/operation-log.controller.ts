import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OperationLogService } from '../services/operation-log.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('house/operation-logs')
@UseGuards(JwtAuthGuard)
export class OperationLogController {
  constructor(private operationLogService: OperationLogService) {}

  @Get()
  findByBiz(@Query('bizType') bizType: string, @Query('bizId') bizId: string, @CurrentUser() user: any) {
    return this.operationLogService.findByBiz(bizType, bizId, user);
  }
}
