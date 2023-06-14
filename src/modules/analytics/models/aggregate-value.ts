import { Field, Float, ObjectType } from '@nestjs/graphql';
import * as moment from 'moment';

@ObjectType()
export class AggregateValue {
  @Field(() => String, { nullable: true })
  time?: string;

  @Field({ nullable: true })
  series: string;

  @Field(() => Float, { nullable: true })
  sum?: number;

  constructor(init?: Partial<AggregateValue>) {
    Object.assign(this, init);
  }

  static fromDataApi(row: any) {
    return new AggregateValue({
      series: row.series,
      time: moment.utc(row.timestamp ?? row.time).format('yyyy-MM-DD HH:mm:ss'),
      sum: row.sum ?? 0,
    });
  }
}
