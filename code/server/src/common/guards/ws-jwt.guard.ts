import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const authHeader = client.handshake?.headers?.authorization || client.handshake?.auth?.token;
    if (!authHeader) {
      client.disconnect();
      return false;
    }
    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = this.jwtService.verify(token);
      (client as any).user = payload;
      return true;
    } catch (e) {
      client.disconnect();
      return false;
    }
  }
}
