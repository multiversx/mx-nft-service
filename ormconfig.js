const db = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const dbSlaves = process.env.DB_SLAVES
  ? JSON.parse(process.env.DB_SLAVES)
  : [db];

module.exports = {
  type: 'mysql',
  synchronize: false,
  dropSchema: false,
  logging: process.env.DB_LOGGING,
  replication: {
    master: db,
    slaves: dbSlaves,
  },
  entities:
    process.env.NODE_ENV === 'test'
      ? ['src/db/**/*.entity.js']
      : ['dist/src/db/**/*.entity.js'],
  migrations: ['dist/src/db/migrations/*.js'],
  cli: {
    migrationsDir: 'src/db/migrations',
  },
  extra: {
    connectionLimit: process.env.DB_CONNECTION_LIMIT,
  },
  keepConnectionAlive: true,
};
