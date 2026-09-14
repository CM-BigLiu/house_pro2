import { Controller, Get, Param, ParseIntPipe, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { PropertyDetailService } from '../services/property-detail.service';

@Controller('house/details')
@UseGuards(JwtAuthGuard)
export class PropertyDetailController {
  constructor(private details: PropertyDetailService) {}

  @Get('rent/:id')
  @RequirePermission('house:rent')
  rental(@Param('id', ParseIntPipe) id: number, @Query('roomId') room: string, @CurrentUser() user: any) {
    const roomId = room === undefined ? undefined : Number(room);
    if (roomId !== undefined && (!Number.isInteger(roomId) || roomId < 1)) throw new BadRequestException('房间编号无效');
    return this.details.detail('rent', id, user, roomId);
  }

  @Get('sale/:id')
  @RequirePermission('house:sale')
  sale(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.details.detail('sale', id, user);
  }
}
