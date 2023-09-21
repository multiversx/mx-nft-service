import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import * as moment from 'moment';

@ObjectType()
export class AnalyticsAggregateValue {
  @Field(() => String, { nullable: true })
  time?: string;

  @Field({ nullable: true })
  series: string;

  @Field(() => Float, { nullable: true })
  min?: number;

  @Field(() => Float, { nullable: true })
  max?: number;

  @Field(() => Float, { nullable: true })
  count?: number;

  @Field(() => Float, { nullable: true })
  value?: number;

  @Field(() => Float, { nullable: true })
  avg?: number;
  @Field(() => [MarketplaceData], { nullable: 'itemsAndList' })
  marketplacesData: MarketplaceData[];

  constructor(init?: Partial<AnalyticsAggregateValue>) {
    Object.assign(this, init);
  }

  static fromDataApi(row: any) {
    return new AnalyticsAggregateValue({
      series: row.series,
      time: moment.utc(row.timestamp ?? row.time).format('yyyy-MM-DD HH:mm:ss'),
      min: row.min ?? 0,
      max: row.max ?? 0,
      count: row.count ?? 0,
      value: row.sum ?? 0,
      avg: row.avg ?? 0,
    });
  }
  static fromTimescaleObject(row: any) {
    return new AnalyticsAggregateValue({
      series: row.series,
      time: moment.utc(row.timestamp ?? row.time).format('yyyy-MM-DD HH:mm:ss'),
      value: row.value ?? 0,
    });
  }

  static fromTimescaleObjectWithMarketplaces(row: any) {
    const rowProperties = proxiedPropertiesOf(row);

    return new AnalyticsAggregateValue({
      series: row.series,
      time: moment.utc(row.timestamp ?? row.time).format('yyyy-MM-DD HH:mm:ss'),
      value: row.value ?? 0,
      marketplacesData: [
        new MarketplaceData({ key: rowProperties.xoxno, value: row.xoxno ?? 0 }),
        new MarketplaceData({ key: rowProperties.frameit, value: row.frameit ?? 0 }),
        new MarketplaceData({ key: rowProperties.deadrare, value: row.deadrare ?? 0 }),
        new MarketplaceData({ key: rowProperties.elrondapes, value: row.elrondapes ?? 0 }),
        new MarketplaceData({ key: rowProperties.elrondnftswap, value: row.elrondnftswap ?? 0 }),
        new MarketplaceData({ key: rowProperties.eneftor, value: row.eneftor ?? 0 }),
        new MarketplaceData({ key: rowProperties.hoghomies, value: row.hoghomies ?? 0 }),
        new MarketplaceData({ key: rowProperties.holoride, value: row.holoride ?? 0 }),
        new MarketplaceData({ key: rowProperties.aquaverse, value: row.aquaverse ?? 0 }),
        new MarketplaceData({ key: rowProperties.ici, value: row.ici ?? 0 }),
      ],
    });
  }
}

@ObjectType()
export class MarketplaceData {
  @Field()
  key: String;
  @Field(() => Float, { nullable: true })
  value: number;
  constructor(init?: Partial<MarketplaceData>) {
    Object.assign(this, init);
  }
}

export function proxiedPropertiesOf<TObj>(obj?: TObj) {
  return new Proxy(
    {},
    {
      get: (_, prop) => prop,
    },
  ) as {
    [P in keyof TObj]?: P;
  };
}
