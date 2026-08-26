import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class DashboardAliasController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats/overview/circle')
  async statsOverview(@CurrentUser() user: any) {
    return this.dashboardService.getOverview(user);
  }

  @Get('workflow/employeeToDoCountLists')
  async workflowTodoCount(@CurrentUser() user: any) {
    const todos = await this.dashboardService.getTodos(user);
    return { list: todos, total: todos.length };
  }

  @Get('workflow/getInstanceList')
  async workflowInstanceList(@CurrentUser() user: any) {
    const todos = await this.dashboardService.getTodos(user);
    return { list: todos, total: todos.length };
  }

  @Get('notice/list/homePageV1')
  async noticeHomePage() {
    return { list: [], total: 0 };
  }

  @Get('employee/homePage')
  async employeeHomePage(@CurrentUser() user: any) {
    return this.dashboardService.getOverview(user);
  }
}
