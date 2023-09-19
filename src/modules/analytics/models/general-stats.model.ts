import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AnalyticsAggregateValue } from './analytics-aggregate-value';
import { Account } from 'src/modules/account-stats/models';

@ObjectType()
export class GeneralAnalyticsModel {
  @Field(() => Int)
  holders: number;
  @Field(() => Int)
  marketplaces: number;
  @Field(() => Int)
  collections: number;
  @Field(() => [AnalyticsAggregateValue])
  nfts: AnalyticsAggregateValue[];
  @Field(() => [AnalyticsAggregateValue])
  volume: AnalyticsAggregateValue[];
  @Field(() => [AnalyticsAggregateValue])
  listing: AnalyticsAggregateValue[];

  constructor(init?: Partial<GeneralAnalyticsModel>) {
    Object.assign(this, init);
  }
}

@ObjectType()
export class HoldersCount {
  @Field()
  address: string;
  @Field(() => Int)
  count: number;

  @Field(() => Account)
  accountDetails: Account;

  constructor(init?: Partial<HoldersCount>) {
    Object.assign(this, init);
  }
}
