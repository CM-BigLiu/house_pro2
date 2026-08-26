import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  employeeId: number;
  mobile: string;
  name: string;
  storeIds: number[];
  assignedStoreIds: number[];
  groupIds: number[];
  dataScope: string;
  customScope?: Record<string, any>;
  permissions: string[];
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
