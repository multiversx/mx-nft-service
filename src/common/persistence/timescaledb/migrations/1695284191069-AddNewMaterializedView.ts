import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewMaterializedView1695284191069 implements MigrationInterface {
  name = 'AddNewMaterializedView1695284191069';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE MATERIALIZED VIEW "nfts_sum_marketplace_daily" WITH (timescaledb.continuous) AS 
    SELECT
      time_bucket('1 day', timestamp) AS time, series, key,
      (select SUM(CASE WHEN "marketplaceKey" ='frameit' THEN value ELSE 0 END)) as frameit,
      (select SUM(CASE WHEN "marketplaceKey" ='xoxno' THEN value ELSE 0 END)) as xoxno,
      (select SUM(CASE WHEN "marketplaceKey" ='elrondapes' THEN value ELSE 0 END)) as elrondapes,
      (select SUM(CASE WHEN "marketplaceKey" ='deadrare' THEN value ELSE 0 END)) as deadrare,
      (select SUM(CASE WHEN "marketplaceKey" ='hoghomies' THEN value ELSE 0 END)) as hoghomies,
      (select SUM(CASE WHEN "marketplaceKey" ='elrondnftswap' THEN value ELSE 0 END)) as elrondnftswap,
      (select SUM(CASE WHEN "marketplaceKey" ='aquaverse' THEN value ELSE 0 END)) as aquaverse,
      (select SUM(CASE WHEN "marketplaceKey" ='holoride' THEN value ELSE 0 END)) as holoride,
      (select SUM(CASE WHEN "marketplaceKey" ='eneftor' THEN value ELSE 0 END)) as eneftor,
      (select SUM(CASE WHEN "marketplaceKey" ='ici' THEN value ELSE 0 END)) as ici,
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
        "SELECT\n      time_bucket('1 day', timestamp) AS time, series, key,\n      (select SUM(CASE WHEN \"marketplaceKey\" ='frameit' THEN value ELSE 0 END)) as frameit,\n      (select SUM(CASE WHEN \"marketplaceKey\" ='xoxno' THEN value ELSE 0 END)) as xoxno,\n      (select SUM(CASE WHEN \"marketplaceKey\" ='elrondapes' THEN value ELSE 0 END)) as elrondapes,\n      (select SUM(CASE WHEN \"marketplaceKey\" ='deadrare' THEN value ELSE 0 END)) as deadrare,\n      (select SUM(CASE WHEN \"marketplaceKey\" ='hoghomies' THEN value ELSE 0 END)) as hoghomies,\n      (select SUM(CASE WHEN \"marketplaceKey\" ='elrondnftswap' THEN value ELSE 0 END)) as elrondnftswap,\n      (select SUM(CASE WHEN \"marketplaceKey\" ='aquaverse' THEN value ELSE 0 END)) as aquaverse,\n      (select SUM(CASE WHEN \"marketplaceKey\" ='holoride' THEN value ELSE 0 END)) as holoride,\n      (select SUM(CASE WHEN \"marketplaceKey\" ='eneftor' THEN value ELSE 0 END)) as eneftor,\n      (select SUM(CASE WHEN \"marketplaceKey\" ='ici' THEN value ELSE 0 END)) as ici,\n      sum(value) AS sum\n    FROM \"hyper_nfts_analytics\"\n    WHERE key = 'volumeUSD'\n    GROUP BY time, series, key;",
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
