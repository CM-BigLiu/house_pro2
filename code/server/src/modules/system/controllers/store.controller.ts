import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StoreService } from '../services/store.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('system/stores')
@UseGuards(JwtAuthGuard)
export class StoreController {
  constructor(private storeService: StoreService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.storeService.findAll(query);
  }
}
