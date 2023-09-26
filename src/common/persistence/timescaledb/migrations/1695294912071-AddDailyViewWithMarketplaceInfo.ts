import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDailyViewWithMarketplaceInfo1695294912071 implements MigrationInterface {
  name = 'AddDailyViewWithMarketplaceInfo1695294912071';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE MATERIALIZED VIEW "nfts_sum_marketplace_daily" WITH (timescaledb.continuous) AS 
    SELECT
      time_bucket('1 day', timestamp) AS time, series, key,
      SUM(CASE WHEN "marketplaceKey" ='frameit' THEN value ELSE 0 END) as frameit,
      SUM(CASE WHEN "marketplaceKey" ='xoxno' THEN value ELSE 0 END) as xoxno,
      SUM(CASE WHEN "marketplaceKey" ='elrondapes' THEN value ELSE 0 END) as elrondapes,
      SUM(CASE WHEN "marketplaceKey" ='deadrare' THEN value ELSE 0 END) as deadrare,
      SUM(CASE WHEN "marketplaceKey" ='hoghomies' THEN value ELSE 0 END) as hoghomies,
      SUM(CASE WHEN "marketplaceKey" ='elrondnftswap' THEN value ELSE 0 END) as elrondnftswap,
      SUM(CASE WHEN "marketplaceKey" ='aquaverse' THEN value ELSE 0 END) as aquaverse,
      SUM(CASE WHEN "marketplaceKey" ='holoride' THEN value ELSE 0 END) as holoride,
      SUM(CASE WHEN "marketplaceKey" ='eneftor' THEN value ELSE 0 END) as eneftor,
      SUM(CASE WHEN "marketplaceKey" ='ici' THEN value ELSE 0 END) as ici,
      sum(value) AS sum
    FROM "hyper_nfts_analytics"
    WHERE key = 'volumeUSD'
    GROUP BY time, series, key;
  `);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        'public',
        'MATERIALIZED_VIEW',
        'nfts_sum_marketplace_daily',
        "SELECT\n      time_bucket('1 day', timestamp) AS time, series, key,\n      SUM(CASE WHEN \"marketplaceKey\" ='frameit' THEN value ELSE 0 END) as frameit,\n      SUM(CASE WHEN \"marketplaceKey\" ='xoxno' THEN value ELSE 0 END) as xoxno,\n      SUM(CASE WHEN \"marketplaceKey\" ='elrondapes' THEN value ELSE 0 END) as elrondapes,\n      SUM(CASE WHEN \"marketplaceKey\" ='deadrare' THEN value ELSE 0 END) as deadrare,\n      SUM(CASE WHEN \"marketplaceKey\" ='hoghomies' THEN value ELSE 0 END) as hoghomies,\n      SUM(CASE WHEN \"marketplaceKey\" ='elrondnftswap' THEN value ELSE 0 END) as elrondnftswap,\n      SUM(CASE WHEN \"marketplaceKey\" ='aquaverse' THEN value ELSE 0 END) as aquaverse,\n      SUM(CASE WHEN \"marketplaceKey\" ='holoride' THEN value ELSE 0 END) as holoride,\n      SUM(CASE WHEN \"marketplaceKey\" ='eneftor' THEN value ELSE 0 END) as eneftor,\n      SUM(CASE WHEN \"marketplaceKey\" ='ici' THEN value ELSE 0 END) as ici,\n      sum(value) AS sum\n    FROM \"hyper_nfts_analytics\"\n    WHERE key = 'volumeUSD'\n    GROUP BY time, series, key;",
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, [
      'MATERIALIZED_VIEW',
      'nfts_sum_marketplace_daily',
      'public',
    ]);
    await queryRunner.query(`DROP MATERIALIZED VIEW "nfts_sum_marketplace_daily"`);
  }
}
