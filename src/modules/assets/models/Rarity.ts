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

  static fromNftRarity(asset: Nft) {
    return asset
      ? new Rarity({
          rank: asset.rank ?? undefined,
          score: asset.score ?? undefined,
          preferredRankAlgorithm: asset.assets?.preferredRankAlgorithm,
          customRank: asset.rarities?.custom?.rank,
          openRarityScore: asset.rarities?.openRarity?.score,
          openRarityRank: asset.rarities?.openRarity?.rank,
          jaccardDistancesScore: asset.rarities?.jaccardDistances?.score,
          jaccardDistancesRank: asset.rarities?.jaccardDistances?.rank,
          traitScore: asset.rarities?.trait?.score,
          traitRank: asset.rarities?.trait?.rank,
          statisticalScore: asset.rarities?.statistical?.score,
          statisticalRank: asset.rarities?.statistical?.rank,
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
