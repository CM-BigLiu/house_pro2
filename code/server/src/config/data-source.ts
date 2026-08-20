import { DataSource } from 'typeorm';
import { databaseConfig } from './database.config';

export default new DataSource(databaseConfig() as any);
