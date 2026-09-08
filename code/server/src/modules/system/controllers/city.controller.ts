import { Controller, Get, UseGuards } from '@nestjs/common';
import { CityService } from '../services/city.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('system/cities')
@UseGuards(JwtAuthGuard)
export class CityController {
  constructor(private cityService: CityService) {}

  @Get()
  async findAll() {
    return this.cityService.findAll();
  }
}
