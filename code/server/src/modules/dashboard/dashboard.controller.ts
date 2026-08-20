import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('overview')
  async overview(@CurrentUser() user: any) {
    return this.dashboardService.getOverview(user);
  }

  @Get('warnings')
  async warnings(@CurrentUser() user: any) {
    return this.dashboardService.getWarnings(user);
  }

  @Get('rankings')
  async rankings(@CurrentUser() user: any) {
    return this.dashboardService.getRankings(user);
  }

  @Get('todos')
  async todos(@CurrentUser() user: any) {
    return this.dashboardService.getTodos(user);
  }
}
