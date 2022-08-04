import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Nft } from 'src/common';

@ObjectType()
export class Rarity {
  @Field(() => Int)
  rank: number;
  @Field()
  score: number;

  constructor(init?: Partial<Rarity>) {
    Object.assign(this, init);
  }

  static fromNftRarity(asset: Nft) {
    return asset
      ? new Rarity({
          rank: asset?.rank,
          score: asset?.score,
        })
      : null;
  }
}
