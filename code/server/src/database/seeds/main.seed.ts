import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedModule } from './seed.module';
import { databaseConfig } from '../../config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot(databaseConfig()),
    SeedModule,
  ],
})
class SeedRunnerModule {}

async function bootstrap() {
  // SeedService 的 OnModuleInit 是唯一入口，避免空库被重复初始化。
  const app = await NestFactory.createApplicationContext(SeedRunnerModule);
  await app.close();
}
bootstrap();
