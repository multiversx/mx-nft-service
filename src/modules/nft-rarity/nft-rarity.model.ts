import { ObjectType } from '@nestjs/graphql';
import { Nft, NftMetadata } from 'src/common';

@ObjectType()
export class NftMinimalModel {
  identifier: string;
  nonce: number;
  metadata: NftMetadata;
  nft_rarity_score?: number;
  nft_rarity_rank?: number;

  constructor(init?: Partial<NftMinimalModel>) {
    Object.assign(this, init);
  }

  static fromNft(nft: Nft): NftMinimalModel {
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
