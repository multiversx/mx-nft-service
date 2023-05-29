import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AggregateValue } from './aggregate-value';

@ObjectType()
export class GeneralAnalyticsModel {
  @Field(() => Int)
  holders: number;
  @Field(() => Int)
  marketplaces: number;
  @Field(() => Int)
  collections: number;
  @Field(() => [AggregateValue])
  nfts: AggregateValue[];
  @Field(() => [AggregateValue])
  volume: AggregateValue[];
  @Field(() => [AggregateValue])
  listing: AggregateValue[];

  constructor(init?: Partial<GeneralAnalyticsModel>) {
    Object.assign(this, init);
  }
}
