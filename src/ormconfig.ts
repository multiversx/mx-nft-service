import { ConnectionOptions } from 'typeorm';
import { MysqlConnectionCredentialsOptions } from 'typeorm/driver/mysql/MysqlConnectionCredentialsOptions';

const db: MysqlConnectionCredentialsOptions = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.NODE_ENV === 'test-e2e' ? ":memory:" : process.env.DB_NAME,
};

const dbSlaves = process.env.DB_SLAVES ? JSON.parse(process.env.DB_SLAVES) : [db];

const config: ConnectionOptions = {
  type:  process.env.NODE_ENV === 'test-e2e' ? 'sqlite' : 'mysql',
  synchronize:  process.env.NODE_ENV === 'test-e2e' ? false : false,
  dropSchema: process.env.NODE_ENV === 'test-e2e' ?  true : false,
  // replication: {
  //   master: db,
  //   slaves: dbSlaves,
  // },
  database: process.env.NODE_ENV === 'test-e2e' ? ":memory:" : process.env.DB_NAME,
  entities: process.env.NODE_ENV === 'test-e2e' ? ['src/db/**/*.entity.js'] : ['dist/db/**/*.entity.js'],
  migrations: process.env.NODE_ENV === 'test-e2e' ? ['src/db/migrations/*.js'] : ['dist/db/migrations/*.js'],
  extra: {
    connectionLimit: process.env.DB_CONNECTION_LIMIT,
    ssl: {
      rejectUnauthorized: false,
    },
  },
};

export = config;
