import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { CollectionStatsEntity } from 'src/db/collection-stats/collection-stats';
import { nominateAmount } from 'src/utils';

@ObjectType()
export class CollectionStats {
  @Field(() => ID)
  identifier: string;
  @Field(() => Int, { nullable: true })
  items: number;
  @Field(() => Int, { nullable: true })
  activeAuctions: number;
  @Field({ nullable: true })
  minPrice: string;
  @Field({ nullable: true })
  saleAverage: string;
  @Field({ nullable: true })
  maxPrice: string;
  @Field(() => Int, { nullable: true })
  auctionsEnded: number;
  @Field({ nullable: true })
  volumeTraded: string;

  constructor(init?: Partial<CollectionStats>) {
    Object.assign(this, init);
  }

  static fromEntity(entity: CollectionStatsEntity, identifier: string) {
    return entity
      ? new CollectionStats({
          identifier: identifier,
          activeAuctions: entity?.activeAuctions || 0,
          auctionsEnded: entity?.auctionsEnded || 0,
          maxPrice: nominateAmount(entity.maxPrice ? entity.maxPrice : '0'),
          minPrice: entity?.minPrice || '0',
          saleAverage: nominateAmount(
            entity.saleAverage ? entity.saleAverage : '0',
          ),
          volumeTraded: nominateAmount(
            entity.volumeTraded ? entity.volumeTraded : '0',
          ),
        })
      : new CollectionStats();
  }
}
