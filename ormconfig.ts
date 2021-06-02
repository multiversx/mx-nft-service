const {config} = require('dotenv');

const buildEnv = () => {
  config({ path: `.env.${process.env.NODE_ENV}` });
  return {
    type: process.env.TYPEORM_CONNECTION,
    host: process.env.TYPEORM_HOST,
    port: process.env.TYPEORM_PORT,
    database: process.env.TYPEORM_DATABASE,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    entities: [process.env.TYPEORM_ENTITIES],
    synchronize: process.env.TYPEORM_SYNCHRONIZE,
    migrations: [process.env.TYPEORM_MIGRATIONS],
    migrationsTableName: process.env.TYPEORM_MIGRATIONS_TABLE_NAME,
    cli: {
      migrationsDir: process.env.TYPEORM_MIGRATIONS_DIR,
    },
  };
};

module.exports = buildEnv();
