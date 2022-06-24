import { ObjectType, Field, Int } from '@nestjs/graphql';
import { NftRarity } from 'src/common';

@ObjectType()
export class Rarity {
  @Field({ nullable: true })
  rank: number;
  @Field({ nullable: true })
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
