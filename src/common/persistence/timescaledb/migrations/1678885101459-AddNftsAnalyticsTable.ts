import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNftsAnalyticsTable1678885101459 implements MigrationInterface {
  name = 'AddNftsAnalyticsTable1678885101459';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hyper_nfts_analytics" ("timestamp" TIMESTAMP NOT NULL, "series" character varying NOT NULL, "key" character varying NOT NULL, "value" numeric(128,64) NOT NULL DEFAULT '0', CONSTRAINT "PK_d3e7ec5231d5fb833d84631482c" PRIMARY KEY ("timestamp", "series", "key"))`,
    );
    await queryRunner.query(
      `SELECT create_hypertable('hyper_nfts_analytics', 'timestamp', chunk_time_interval => INTERVAL '14 days')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "hyper_nfts_analytics"`);
  }
}
