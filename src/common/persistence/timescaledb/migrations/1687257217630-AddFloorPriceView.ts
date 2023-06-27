import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFloorPriceView1687257217630 implements MigrationInterface {
  name = 'AddFloorPriceView1687257217630';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE MATERIALIZED VIEW "nfts_floor_price_daily" WITH (timescaledb.continuous) AS 
    SELECT
      time_bucket('1 day', timestamp) AS time, series, key,
      last(value, timestamp) AS last,min(value) AS min
    FROM "hyper_nfts_analytics"
    WHERE key = 'floorPriceUSD'
    GROUP BY time, series, key;
  `);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        'public',
        'MATERIALIZED_VIEW',
        'nfts_floor_price_daily',
        "SELECT\n      time_bucket('1 day', timestamp) AS time, series, key,\n      last(value, timestamp) AS last,min(value) AS min\n    FROM \"hyper_nfts_analytics\"\n    WHERE key = 'floorPriceUSD'\n    GROUP BY time, series, key;",
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['MATERIALIZED_VIEW', 'nfts_floor_price_daily', 'public'],
    );
    await queryRunner.query(`DROP MATERIALIZED VIEW "nfts_floor_price_daily"`);
  }
}
