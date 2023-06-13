import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { HistoricDataModel } from './analytics.model';
import { CollectionsDetailsModel } from './collections-details.model';

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

  @Field(() => [HistoricDataModel])
  volumeData: HistoricDataModel[];

  constructor(init?: Partial<CollectionsAnalyticsModel>) {
    Object.assign(this, init);
  }

  static fromTimescaleModel(collection: HistoricDataModel) {
    return new CollectionsAnalyticsModel({
      collectionIdentifier: collection.series,
      volume24h: collection.value,
    });
  }
}
