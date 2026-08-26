import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

@WebSocketGateway({ namespace: 'events', cors: { origin: '*' } })
@UseGuards(WsJwtGuard)
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const user = (client as any).user;
    if (user?.employeeId) {
      client.join(`user:${user.employeeId}`);
      client.join(`store:${user.storeIds?.[0] || 0}`);
    }
  }

  handleDisconnect(client: Socket) {
    client.rooms.forEach((room) => client.leave(room));
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    client.emit('pong', { time: new Date().toISOString() });
  }

  emitToUser(employeeId: number | string, event: string, payload: any) {
    this.server.to(`user:${employeeId}`).emit(event, payload);
  }

  emitToStore(storeId: number | string, event: string, payload: any) {
    this.server.to(`store:${storeId}`).emit(event, payload);
  }

  broadcastDashboardUpdate(payload: any) {
    this.server.emit('dashboard:update', payload);
  }

  broadcastStatusChange(payload: { entityType: string; entityId: number; status: string }) {
    this.server.emit('status:change', payload);
  }
}
