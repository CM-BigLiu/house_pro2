import { Controller, Get, UseGuards } from '@nestjs/common';
import { PermissionService } from '../services/permission.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('system/permissions')
@UseGuards(JwtAuthGuard)
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Get('tree')
  async tree() {
    return this.permissionService.findTree();
  }
}
