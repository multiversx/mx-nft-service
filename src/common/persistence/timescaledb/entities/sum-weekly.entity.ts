import { PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  expression: `
    SELECT
      time_bucket('7 day', timestamp) AS time, series, key,
      last(value, timestamp) AS last,sum(value) AS sum
    FROM "hyper_nfts_analytics"
    WHERE key = 'volumeUSD'
    GROUP BY time, series, key;
  `,
  materialized: true,
  database: 'timescaledb',
  name: 'nfts_sum_weekly',
})
export class SumWeekly {
  @ViewColumn()
  @PrimaryColumn()
  time: Date = new Date();

  @ViewColumn()
  sum = '0';

  @ViewColumn()
  series?: string;

  @ViewColumn()
  key?: string;

  constructor(init?: Partial<SumWeekly>) {
    Object.assign(this, init);
  }
}
