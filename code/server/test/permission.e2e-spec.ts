import 'reflect-metadata';
import { CanActivate, ExecutionContext, INestApplication, Injectable } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import * as http from 'http';

import { PermissionGuard } from '../src/common/guards/permission.guard';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RentalController } from '../src/modules/house/controllers/rental.controller';
import { RentalService } from '../src/modules/house/services/rental.service';

@Injectable()
class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerPermissions = request.headers['x-test-permissions'];
    request.user = {
      employeeId: 99,
      name: '只读用户',
      mobile: 'readonly',
      storeIds: [1],
      assignedStoreIds: [],
      groupIds: [],
      dataScope: 'store',
      permissions: typeof headerPermissions === 'string'
        ? headerPermissions.split(',').filter(Boolean)
        : ['home', 'house:rent'],
    };
    return true;
  }
}

function requestJson(
  port: number,
  method: string,
  path: string,
  body?: unknown,
  permissions?: string[],
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? '' : JSON.stringify(body);
    const request = http.request({
      host: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(permissions ? { 'X-Test-Permissions': permissions.join(',') } : {}),
      },
    }, (response) => {
      let responseBody = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => resolve({
        status: response.statusCode || 0,
        body: responseBody ? JSON.parse(responseBody) : undefined,
      }));
    });
    request.on('error', reject);
    request.end(payload);
  });
}

describe('e2e: route existence and permission protection', () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RentalController],
      providers: [
        {
          provide: RentalService,
          useValue: {
            createSet: jest.fn(),
            findSet: jest.fn().mockResolvedValue({ id: 1, code: 'CZ0001' }),
            updateSet: jest.fn().mockResolvedValue({ id: 1, code: 'CZ0001' }),
          },
        },
        { provide: APP_GUARD, useClass: PermissionGuard },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    const testAuthGuard = new TestAuthGuard();
    app.use((request: any, _response: any, next: () => void) => {
      testAuthGuard.canActivate({
        switchToHttp: () => ({ getRequest: () => request }),
      } as ExecutionContext);
      next();
    });
    await app.init();
    const server = app.getHttpAdapter().getHttpServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /house/rental-sets returns 403 for readonly permissions', async () => {
    expect((await requestJson(port, 'POST', '/house/rental-sets', {})).status).toBe(403);
  });

  it('exposes rental detail and update routes with their respective permissions', async () => {
    expect((await requestJson(port, 'GET', '/house/rental-sets/1')).status).toBe(403);
    expect((await requestJson(port, 'GET', '/house/rental-sets/1', undefined, ['renting:edit'])).status).toBe(200);
    expect((await requestJson(port, 'PUT', '/house/rental-sets/1', {}, ['house:rent'])).status).toBe(403);
    expect((await requestJson(port, 'PUT', '/house/rental-sets/1', {}, ['renting:edit'])).status).toBe(200);
  });




  it('removed feature routes return 404', async () => {
    expect((await requestJson(port, 'GET', '/house/blacklist', undefined, ['*'])).status).toBe(404);
  });

});
