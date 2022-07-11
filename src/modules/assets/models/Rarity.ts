import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Nft, NftRarity } from 'src/common';

@ObjectType()
export class Rarity {
  @Field({ nullable: true })
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
