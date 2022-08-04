import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Nft } from 'src/common';

@ObjectType()
export class Rarity {
  @Field(() => Int, { nullable: true })
  rank: number;
  @Field({ nullable: true })
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
