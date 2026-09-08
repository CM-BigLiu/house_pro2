/**
 * e2e smoke 测试：
 * 验证后端 Nest 应用可启动、auth 公开端点按 design 契约应答。
 * 使用独立测试库 house_pro_e2e（synchronize 建表），不触碰业务库 house_pro。
 *
 * 运行方式：cd code/server && npm run test:e2e
 */
import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as http from 'http';

import { AuthModule } from '../src/modules/auth/auth.module';
import { RefreshToken } from '../src/modules/auth/entities/refresh-token.entity';
import { Employee } from '../src/modules/system/entities/employee.entity';
import { Role } from '../src/modules/system/entities/role.entity';
import { Permission } from '../src/modules/system/entities/permission.entity';
import { Store } from '../src/modules/system/entities/store.entity';
import { Department } from '../src/modules/system/entities/department.entity';
import { Position } from '../src/modules/system/entities/position.entity';
import { Group } from '../src/modules/system/entities/group.entity';
import { City } from '../src/modules/system/entities/city.entity';
import { Company } from '../src/modules/system/entities/company.entity';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

const E2E_DB = process.env.E2E_DB_DATABASE || 'house_pro_e2e';

const ENTITIES = [
  RefreshToken,
  Employee,
  Role,
  Permission,
  Store,
  Department,
  Position,
  Group,
  City,
  Company,
];

function requestJson(
  port: number,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? '' : JSON.stringify(body);
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method,
        path,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed: any = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            // ignore
          }
          resolve({ status: res.statusCode || 0, body: parsed });
        });
      },
    );
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('http timeout')));
    req.end(payload);
  });
}

describe('e2e: auth 端点 smoke', () => {
  let app: INestApplication;
  let admin: DataSource;
  let port: number;

  beforeAll(async () => {
    const pgConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

    admin = new DataSource({ type: 'postgres', ...pgConfig, database: 'postgres' });
    await admin.initialize();
    await admin.query(`DROP DATABASE IF EXISTS ${E2E_DB}`);
    await admin.query(`CREATE DATABASE ${E2E_DB}`);

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET: 'e2e_access_secret',
              JWT_REFRESH_SECRET: 'e2e_refresh_secret',
              JWT_ACCESS_EXPIRES_IN: '2h',
              JWT_REFRESH_EXPIRES_IN: '7d',
            }),
          ],
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          ...pgConfig,
          database: E2E_DB,
          entities: ENTITIES,
          synchronize: true,
          logging: ['error'],
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: ['error', 'warn'] });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    const server = app.getHttpAdapter().getHttpServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;
  }, 60000);

  afterAll(async () => {
    await app?.close();
    await admin?.query(`DROP DATABASE IF EXISTS ${E2E_DB}`);
    await admin?.destroy();
  });

  it('应用可启动，POST /auth/refresh 无效 token 返回 401', async () => {
    const res = await requestJson(port, 'POST', '/auth/refresh', {
      refreshToken: 'invalid-e2e-token',
    });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
  });

  it('POST /auth/login 错误凭据返回 401', async () => {
    const res = await requestJson(port, 'POST', '/auth/login', {
      mobile: 'nonexistent_user',
      password: 'wrong_password',
    });
    expect(res.status).toBe(401);
  });
});
