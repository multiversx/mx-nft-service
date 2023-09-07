import { ConnectionOptions } from 'typeorm';
import { MysqlConnectionCredentialsOptions } from 'typeorm/driver/mysql/MysqlConnectionCredentialsOptions';

const db: MysqlConnectionCredentialsOptions = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const dbSlaves = process.env.DB_SLAVES ? JSON.parse(process.env.DB_SLAVES) : [db];

const config: ConnectionOptions = {
  type: 'mysql',
  synchronize: false,
  dropSchema: false,
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
};

export = config;
