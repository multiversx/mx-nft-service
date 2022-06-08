import { ObjectType, Field } from '@nestjs/graphql';
import { NftRarity } from 'src/common';

@ObjectType()
export class Rarity {
  @Field()
  avgRarity: number;
  @Field()
  statRarity: number;
  @Field()
  rarityScore: number;
  @Field()
  rarityScoreNormed: number;
  @Field()
  usedTraitsCount: number;

  constructor(init?: Partial<Rarity>) {
    Object.assign(this, init);
  }

  static fromNftRarity(rarity: NftRarity) {
    return rarity
      ? new Rarity({
          avgRarity: rarity?.avgRarity,
          statRarity: rarity?.statRarity,
          rarityScore: rarity?.rarityScore,
          rarityScoreNormed: rarity?.rarityScoreNormed,
          usedTraitsCount: rarity?.usedTraitsCount,
        })
      : null;
  }
}
