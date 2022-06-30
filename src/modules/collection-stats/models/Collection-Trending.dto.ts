import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { CollectionStatsEntity } from 'src/db/collection-stats/collection-stats';
import { Price } from 'src/modules/assets/models';
import { nominateAmount } from 'src/utils';

@ObjectType()
export class TrendingCollection {
  @Field(() => ID)
  identifier: string;
  @Field({ nullable: true })
  name: string;
  @Field(() => Price, { nullable: true })
  floarPrice: Price;
  @Field(() => Price, { nullable: true })
  volume: Price;
  @Field({ nullable: true })
  percentage: string;
  @Field({ nullable: true })
  imageUrl: string;
  @Field({ nullable: true })
  verified: boolean;
  constructor(init?: Partial<TrendingCollection>) {
    Object.assign(this, init);
  }

  static fromEntity(entity: CollectionStatsEntity, identifier: string) {
    return entity
      ? new TrendingCollection({
          identifier: identifier,
        })
      : new TrendingCollection();
  }
}
