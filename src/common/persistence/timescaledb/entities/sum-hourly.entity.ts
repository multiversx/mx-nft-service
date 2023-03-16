import { ViewEntity, ViewColumn, PrimaryColumn } from 'typeorm';

ViewEntity({
  expression: `
    SELECT
      time_bucket('1 hour', timestamp) AS time, series, key,
      last(value, timestamp) AS last,sum(value) AS sum
    FROM "hyper_dex_analytics"
    WHERE key = 'volumeUSD'
    AND timestamp >= NOW() - INTERVAL '1 day'
    GROUP BY time, series, key;
  `,
  materialized: true,
  name: 'sum_hourly',
});
export class SumHourly {
  @ViewColumn()
  @PrimaryColumn()
  time: Date = new Date();

  @ViewColumn()
  sum = '0';

  @ViewColumn()
  series?: string;

  @ViewColumn()
  key?: string;

  constructor(init?: Partial<SumHourly>) {
    Object.assign(this, init);
  }
}
