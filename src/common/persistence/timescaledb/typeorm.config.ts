import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';

dotenvExpand.expand(dotenv.config());

export default new DataSource({
  type: 'postgres',
  host: process.env.TIMESCALEDB_URL,
  port: parseInt(process.env.TIMESCALEDB_PORT),
  username: process.env.TIMESCALEDB_USERNAME,
  password: process.env.TIMESCALEDB_PASSWORD,
  database: process.env.TIMESCALEDB_DATABASE,
  migrationsTransactionMode: 'each',
  entities: ['dist/common/**/**/entities/*.entity.{js,ts}'],
  migrations: ['dist/common/persistence/timescaledb/migrations/*.js'],
});
