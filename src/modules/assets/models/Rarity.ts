import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Nft } from 'src/common';

@ObjectType()
export class Rarity {
  @Field({ nullable: true })
  preferredRankAlgorithm: string;

  @Field(() => Int, { nullable: true })
  rank: number;
  @Field({ nullable: true })
  score: number;

  @Field(() => Int, { nullable: true })
  customRank: number;

  @Field({ nullable: true })
  openRarityScore: number;
  @Field({ nullable: true })
  openRarityRank: number;
  @Field({ nullable: true })
  jaccardDistancesScore: number;
  @Field({ nullable: true })
  jaccardDistancesRank: number;
  @Field({ nullable: true })
  traitScore: number;
  @Field({ nullable: true })
  traitRank: number;
  @Field({ nullable: true })
  statisticalScore: number;
  @Field({ nullable: true })
  statisticalRank: number;

  constructor(init?: Partial<Rarity>) {
    Object.assign(this, init);
  }

  static fromNftRarity(nft: Nft): Rarity {
    return nft
      ? new Rarity({
          rank: nft.rank,
          score: nft.score,
          preferredRankAlgorithm: nft.assets?.preferredRankAlgorithm,
          customRank: nft.rarities?.custom?.rank,
          openRarityScore: nft.rarities?.openRarity?.score,
          openRarityRank: nft.rarities?.openRarity?.rank,
          jaccardDistancesScore: nft.rarities?.jaccardDistances?.score,
          jaccardDistancesRank: nft.rarities?.jaccardDistances?.rank,
          traitScore: nft.rarities?.trait?.score,
          traitRank: nft.rarities?.trait?.rank,
          statisticalScore: nft.rarities?.statistical?.score,
          statisticalRank: nft.rarities?.statistical?.rank,
        })
      : null;
  }

  static fromElasticNftRarity(nft: any): Rarity {
    return nft
      ? new Rarity({
          preferredRankAlgorithm: undefined,
          rank: undefined,
          score: undefined,
          customRank: nft.nft_rank_custom,
          openRarityScore: nft.nft_score_openRarity,
          openRarityRank: nft.nft_rank_openRarity,
          jaccardDistancesScore: nft.nft_score_jaccardDistances,
          jaccardDistancesRank: nft.nft_rank_jaccardDistances,
          traitScore: nft.nft_score_trait,
          traitRank: nft.nft_rank_trait,
          statisticalScore: nft.nft_score_statistical,
          statisticalRank: nft.nft_rank_statistical,
        })
      : null;
  }
}
