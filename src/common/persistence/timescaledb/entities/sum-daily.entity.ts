import { PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  expression: `
    SELECT
      time_bucket('1 day', timestamp) AS time, series, key,
      last(value, timestamp) AS last,sum(value) AS sum
    FROM "hyper_nfts_analytics"
    WHERE key = 'volumeUSD'
    GROUP BY time, series, key;
  `,
  materialized: true,
  name: 'nfts_sum_daily',
})
export class SumDaily {
  @ViewColumn()
  @PrimaryColumn()
  time: Date = new Date();

  @ViewColumn()
  sum = '0';

  @ViewColumn()
  series?: string;

  @ViewColumn()
  key?: string;

  constructor(init?: Partial<SumDaily>) {
    Object.assign(this, init);
  }
}

@ViewEntity({
  expression: `
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
  `,
  materialized: true,
  name: 'nfts_sum_marketplace_daily',
})
export class SumMarketplaceDaily {
  @ViewColumn()
  @PrimaryColumn()
  time: Date = new Date();

  @ViewColumn()
  sum = '0';
  @ViewColumn()
  frameit = '0';
  @ViewColumn()
  xoxno = '0';
  @ViewColumn()
  elrondapes = '0';
  @ViewColumn()
  deadrare = '0';
  @ViewColumn()
  hoghomies = '0';
  @ViewColumn()
  elrondnftswap = '0';
  @ViewColumn()
  aquaverse = '0';
  @ViewColumn()
  holoride = '0';
  @ViewColumn()
  eneftor = '0';
  @ViewColumn()
  ici = '0';

  @ViewColumn()
  series?: string;

  @ViewColumn()
  key?: string;

  constructor(init?: Partial<SumDaily>) {
    Object.assign(this, init);
  }
}

@ViewEntity({
  expression: `
    SELECT
      time_bucket('1 day', timestamp) AS time, series, key,
      last(value, timestamp) AS last,min(value) AS min
    FROM "hyper_nfts_analytics"
    WHERE key = 'floorPriceUSD'
    GROUP BY time, series, key;
  `,
  materialized: true,
  name: 'nfts_floor_price_daily',
})
export class FloorPriceDaily {
  @ViewColumn()
  @PrimaryColumn()
  time: Date = new Date();

  @ViewColumn()
  min = '0';

  @ViewColumn()
  series?: string;

  @ViewColumn()
  key?: string;

  constructor(init?: Partial<FloorPriceDaily>) {
    Object.assign(this, init);
  }
}
