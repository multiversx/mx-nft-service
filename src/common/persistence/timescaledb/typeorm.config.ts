import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';

dotenv.config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('TIMESCALEDB_URL'),
  port: configService.get('TIMESCALEDB_PORT'),
  username: configService.get('TIMESCALEDB_USERNAME'),
  password: configService.get('TIMESCALEDB_PASSWORD'),
  database: configService.get('TIMESCALEDB_DATABASE'),
  migrationsTransactionMode: 'none',
  entities: ['dist/common/**/**/entities/*.entity.{js,ts}'],
  migrations: ['dist/common/persistence/timescaledb/migrations/*.js'],
});
