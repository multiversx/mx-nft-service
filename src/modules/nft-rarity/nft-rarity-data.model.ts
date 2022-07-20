import { ObjectType } from '@nestjs/graphql';
import { Nft, NftMetadata } from 'src/common';

@ObjectType()
export class NftRarityData {
  identifier: string;
  nonce: number;
  metadata: NftMetadata;
  nft_rarity_score?: number;
  nft_rarity_rank?: number;

  constructor(init?: Partial<NftRarityData>) {
    Object.assign(this, init);
  }

  static fromNft(nft: Nft): NftRarityData {
    return nft
      ? {
          identifier: nft.identifier,
          nonce: nft.nonce,
          metadata: nft.metadata,
          nft_rarity_score: nft.score,
          nft_rarity_rank: nft.rank,
        }
      : null;
  }
}
