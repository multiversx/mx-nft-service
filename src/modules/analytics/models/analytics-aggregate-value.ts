import { Field, Float, ObjectType } from '@nestjs/graphql';
import * as moment from 'moment';
import { KeyValueType } from 'src/modules/assets/models';

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
  @Field(() => [KeyValueType], { nullable: 'itemsAndList' })
  marketplacesData: KeyValueType[];

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
        new KeyValueType({ key: rowProperties.xoxno, value: row.xoxno }),
        new KeyValueType({ key: rowProperties.frameit, value: row.frameit }),
        new KeyValueType({ key: rowProperties.deadrare, value: row.deadrare }),
        new KeyValueType({ key: rowProperties.elrondapes, value: row.elrondapes }),
        new KeyValueType({ key: rowProperties.elrondnftswap, value: row.elrondnftswap }),
        new KeyValueType({ key: rowProperties.eneftor, value: row.eneftor }),
        new KeyValueType({ key: rowProperties.hoghomies, value: row.hoghomies }),
        new KeyValueType({ key: rowProperties.holoride, value: row.holoride }),
        new KeyValueType({ key: rowProperties.aquaverse, value: row.aquaverse }),
        new KeyValueType({ key: rowProperties.ici, value: row.ici }),
      ],
    });
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
