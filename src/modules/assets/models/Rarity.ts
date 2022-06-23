import { ObjectType, Field } from '@nestjs/graphql';
import { NftRarity } from 'src/common';

@ObjectType()
export class Rarity {
  @Field()
  rank: number;
  @Field()
  score: number;

  constructor(init?: Partial<Rarity>) {
    Object.assign(this, init);
  }

  static fromNftRarity(rarity: NftRarity) {
    return rarity
      ? new Rarity({
          rank: rarity?.rank,
          score: rarity?.score ? rarity.score : rarity.rarityScore,
        })
      : null;
  }
}
