import { Nft, NftMetadata } from 'src/common';
import { NftRarityEntity } from 'src/db/nft-rarity';

export class NftRarityData {
  identifier: string;
  nonce: number;

  metadata: NftMetadata;
  DNA?: number[];

  score_openRarity: number;
  rank_openRarity: number;

  score_jaccardDistances: number;
  rank_jaccardDistances: number;

  score_trait: number;
  rank_trait: number;

  score_statistical: number;
  rank_statistical: number;

  constructor(init?: Partial<NftRarityData>) {
    Object.assign(this, init);
  }

  static fromNft(nft: Nft): NftRarityData {
    if (!nft) {
      return undefined;
    }

    // todo map
    return nft
      ? {
          identifier: nft.identifier,
          nonce: nft.nonce,
          metadata: nft.metadata,
          score_openRarity: 0, //nft.nft_score_openRarity,
          rank_openRarity: 0, //nft.nft_rank_openRarity,
          score_jaccardDistances: 0, //nft.nft_score_jaccardDistances,
          rank_jaccardDistances: 0, //nft.nft_rank_jaccardDistances,
          score_trait: 0, //nft.nft_score_trait,
          rank_trait: 0, //nft.nft_rank_trait,
          score_statistical: 0, //nft.nft_score_statistical,
          rank_statistical: 0, //nft.nft_rank_statistical,
        }
      : null;
  }

  static fromElasticNft(nft: any): NftRarityData {
    return nft
      ? {
          identifier: nft.identifier,
          nonce: nft.nonce,
          metadata: undefined,
          score_openRarity: nft.nft_score_openRarity,
          rank_openRarity: nft.nft_rank_openRarity,
          score_jaccardDistances: nft.nft_score_jaccardDistances,
          rank_jaccardDistances: nft.nft_rank_jaccardDistances,
          score_trait: nft.nft_score_trait,
          rank_trait: nft.nft_rank_trait,
          score_statistical: nft.nft_score_statistical,
          rank_statistical: nft.nft_rank_statistical,
        }
      : null;
  }

  static fromNfts(nfts: Nft[]): NftRarityData[] {
    return this.computeDNA(nfts.map((nft) => this.fromNft(nft)));
  }

  static fromElasticNfts(nfts: any[]): NftRarityData[] {
    return this.computeDNA(nfts.map((nft) => this.fromElasticNft(nft)));
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

  static areIdenticalRarities(
    nftRarityData: NftRarityData,
    nftRarityEntity: NftRarityEntity,
  ): boolean {
    if (
      Number(nftRarityData.score_openRarity) !==
        Number(nftRarityEntity.score_openRarity) ||
      nftRarityData.rank_openRarity !== nftRarityEntity.rank_openRarity
    ) {
      return false;
    }
    if (
      Number(nftRarityData.score_jaccardDistances) !==
        Number(nftRarityEntity.score_jaccardDistances) ||
      nftRarityData.rank_jaccardDistances !==
        nftRarityEntity.rank_jaccardDistances
    ) {
      return false;
    }
    if (
      Number(nftRarityData.score_statistical) !==
        Number(nftRarityEntity.score_statistical) ||
      nftRarityData.rank_statistical !== nftRarityEntity.rank_statistical
    ) {
      return false;
    }
    if (
      Number(nftRarityData.score_trait) !==
        Number(nftRarityEntity.score_trait) ||
      nftRarityData.rank_trait !== nftRarityEntity.rank_trait
    ) {
      return false;
    }
    return true;
  }
}
