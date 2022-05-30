import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { nominateAmount } from 'src/utils';

@ObjectType()
export class CollectionStats {
  @Field(() => ID)
  identifier: string;
  @Field(() => Int, { nullable: true })
  itemsCount: number;
  @Field(() => Int, { nullable: true })
  activeAuctions: number;
  @Field({ nullable: true })
  minPrice: string;
  @Field({ nullable: true })
  saleAvarage: string;
  @Field({ nullable: true })
  maxPrice: string;
  @Field(() => Int, { nullable: true })
  auctionsEndedCount: number;
  @Field({ nullable: true })
  volumeTraded: string;

  constructor(init?: Partial<CollectionStats>) {
    Object.assign(this, init);
  }

  static fromEntity(identifier: string) {
    return new CollectionStats({
      identifier: identifier,
      activeAuctions: 1,
      auctionsEndedCount: 3,
      itemsCount: 121,
      maxPrice: nominateAmount('10'),
      minPrice: nominateAmount('0.01'),
      saleAvarage: nominateAmount('5'),
      volumeTraded: nominateAmount('100'),
    });
  }
}
