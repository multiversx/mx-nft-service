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
      last(value, timestamp) AS last,sum(value) AS sum
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
  sum = '0';

  @ViewColumn()
  series?: string;

  @ViewColumn()
  key?: string;

  constructor(init?: Partial<FloorPriceDaily>) {
    Object.assign(this, init);
  }
}
