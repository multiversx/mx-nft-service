import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AnalyticsStats {
  @Field()
  nfts: number;
  @Field()
  collections: number;
  @Field()
  holders: number;
  @Field()
  createdLastMonth: number;
  @Field()
  volume: number;
  @Field()
  marketplaces: number;

  constructor(init?: Partial<AnalyticsStats>) {
    Object.assign(this, init);
  }
}
