import { DataSource, DataSourceOptions } from 'typeorm';
import { MysqlConnectionCredentialsOptions } from 'typeorm/driver/mysql/MysqlConnectionCredentialsOptions';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';

dotenvExpand.expand(dotenv.config());

const db: MysqlConnectionCredentialsOptions = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const dbSlaves = process.env.DB_SLAVES ? JSON.parse(process.env.DB_SLAVES) : [db];
const connectionSource = new DataSource({
  migrationsTableName: 'migrations',
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: process.env.DB_LOGGING,
  synchronize: false,
  replication: {
    master: db,
    slaves: dbSlaves,
  },
  entities: process.env.NODE_ENV === 'test-e2e' ? ['src/db/**/*.entity.js'] : ['dist/db/**/*.entity.js'],
  migrations: ['dist/db/migrations/*.js'],
  extra: {
    connectionLimit: process.env.DB_CONNECTION_LIMIT,
    ssl: {
      rejectUnauthorized: false,
    },
  },
} as DataSourceOptions);

export default connectionSource;
