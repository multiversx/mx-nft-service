import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { CollectionsDetailsModel } from './collections-details.model';
import { AnalyticsAggregateValue } from './analytics-aggregate-value';

@ObjectType()
export class CollectionsAnalyticsModel {
  @Field()
  collectionIdentifier: string;
  @Field(() => CollectionsDetailsModel)
  details: CollectionsDetailsModel;
  @Field(() => Int)
  holders: number;
  @Field(() => Float, { nullable: true })
  volume24h: number;
  @Field()
  floorPrice: number;

  @Field(() => [AnalyticsAggregateValue])
  volumeData: AnalyticsAggregateValue[];

  constructor(init?: Partial<CollectionsAnalyticsModel>) {
    Object.assign(this, init);
  }

  static fromTimescaleModel(collection: AnalyticsAggregateValue) {
    return new CollectionsAnalyticsModel({
      collectionIdentifier: collection.series,
      volume24h: collection.value,
    });
  }
}
