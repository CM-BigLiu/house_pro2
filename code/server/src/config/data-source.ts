import { DataSource } from 'typeorm';
import { databaseConfig } from './database.config';

export default new DataSource({
  ...databaseConfig(),
  synchronize: false,
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
} as any);
