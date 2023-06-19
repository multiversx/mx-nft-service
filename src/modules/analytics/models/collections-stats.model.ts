import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { CollectionsDetailsModel } from './collections-details.model';
import { AggregateValue } from './aggregate-value';

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

  @Field(() => [AggregateValue])
  volumeData: AggregateValue[];

  constructor(init?: Partial<CollectionsAnalyticsModel>) {
    Object.assign(this, init);
  }

  static fromTimescaleModel(collection: AggregateValue) {
    return new CollectionsAnalyticsModel({
      collectionIdentifier: collection.series,
      volume24h: collection.value,
    });
  }
}
