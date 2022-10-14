import e from 'express';
import { Nft, NftMetadata } from 'src/common';

export class NftRarityData {
  identifier: string;
  nonce: number;

  metadata: NftMetadata;
  DNA?: number[];

  // manual
  nft_rarity_score?: number;
  nft_rarity_rank?: number;
  // score: number;
  // rank: number;

  // opScore: number;
  // opRank: number;

  // jdScore: number;
  // jdRank: number;

  // trScore: number;
  // trRank: number;

  // srScore: number;
  // srRank: number;

  constructor(init?: Partial<NftRarityData>) {
    Object.assign(this, init);
  }

  private static fromNft(nft: Nft): NftRarityData {
    if (!nft) {
      return undefined;
    }

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

  private static fromElasticNft(nft: any): NftRarityData {
    return nft
      ? {
          identifier: nft.identifier,
          nonce: nft.nonce,
          metadata: undefined,
          nft_rarity_score: nft.nft_rarity_score,
          nft_rarity_rank: nft.nft_rarity_rank,
        }
      : null;
  }

  static fromNfts(nfts: Nft[]): NftRarityData[] {
    return this.computeDNA(nfts.map((nft) => this.fromNft(nft)));
  }

  static fromElasticNfts(nfts: any[]): NftRarityData[] {
    return this.computeDNA(
      nfts.map((nft) => this.fromElasticNft(nft)),
    );
  }

  static computeDNA(nfts: NftRarityData[]): NftRarityData[] {
    let nftsWithDNA: NftRarityData[] = JSON.parse(JSON.stringify(nfts));

    let traitTypeIndexes: number[] = [];
    let attributeIndexes: number[][] = [];

    for (let nft of nftsWithDNA) {
      nft.DNA = [];

      if (!nft.metadata || !nft.metadata.attributes) {
        continue;
      }

      for (const [key, value] of Object.entries(nft.metadata.attributes)) {
        if (value.trait_type === undefined || value.value === undefined) {
          continue;
        }

        const traitType = String(value.trait_type);
        const traitValue = String(value.value);

        if (traitValue.toLowerCase() === 'none' || traitValue === '') {
          continue;
        }

        let traitIndex: number = null;
        let attributeIndex: number = null;

        traitIndex = this.getOrSetTraitIndex(traitTypeIndexes, traitType);

        attributeIndex = this.getOrSetAttributeIndex(
          attributeIndexes,
          traitIndex,
          traitValue,
        );

        nft.DNA[traitIndex] = attributeIndex;
      }

      nft.metadata = null;
    }

    return nftsWithDNA;
  }

  static getOrSetTraitIndex(
    traitTypeIndexes: number[],
    traitType: string,
  ): number {
    if (traitTypeIndexes[traitType] === undefined) {
      traitTypeIndexes[traitType] = Object.entries(traitTypeIndexes).length;
    }

    return traitTypeIndexes[traitType];
  }

  static getOrSetAttributeIndex(
    attributeIndexes: number[][],
    traitIndex: number,
    traitValue: string,
  ): number {
    if (attributeIndexes?.[traitIndex] === undefined) {
      attributeIndexes[traitIndex] = [];
    }

    if (attributeIndexes[traitIndex][traitValue] === undefined) {
      attributeIndexes[traitIndex][traitValue] = Object.entries(
        attributeIndexes[traitIndex],
      ).length;
    }

    return attributeIndexes[traitIndex][traitValue];
  }
}
