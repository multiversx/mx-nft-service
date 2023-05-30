import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AggregateValue } from './aggregate-value';
import { Collection } from 'src/modules/nftCollections/models/Collection.dto';

@ObjectType()
export class CollectionsAnalyticsModel {
  @Field()
  collectionIdentifier: string;
  @Field()
  collectionName: string;
  @Field(() => Int)
  items: number;
  @Field(() => Int)
  holders: number;
  @Field(() => [AggregateValue])
  volume24h: AggregateValue[];
  @Field(() => [AggregateValue])
  floorPrice: number;

  constructor(init?: Partial<CollectionsAnalyticsModel>) {
    Object.assign(this, init);
  }

  static fromApiCollection(
    collection: Collection,
  ) {
    return new CollectionsAnalyticsModel({
      collectionIdentifier: collection.collection,
      collectionName: collection.name,
      items: collection.nftsCount
    });
  }
}
