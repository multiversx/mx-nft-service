import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Nft } from 'src/common';

@ObjectType()
export class Rarity {
  @Field({ nullable: true })
  preferredRankAlgorithm: string;

  // todo map
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

  // todo map
  static fromNftRarity(asset: Nft) {
    return asset
      ? new Rarity({
          rank: 0,
          score: 0,
          preferredRankAlgorithm: asset.assets?.preferredRankAlgorithm,
          customRank: 0, //asset?.nft_rank_custom,
          openRarityScore: 0, //asset?.nft_score_openRarity,
          openRarityRank: 0, //asset?.nft_rank_openRarity,
          jaccardDistancesScore: 0, //asset?.nft_score_jaccardDistances,
          jaccardDistancesRank: 0, //asset?.nft_rank_jaccardDistances,
          traitScore: 0, //asset?.nft_score_trait,
          traitRank: 0, //asset?.nft_rank_trait,
          statisticalScore: 0, //asset?.nft_score_statistical,
          statisticalRank: 0, //asset?.nft_rank_statistical,
        })
      : null;
  }
}
