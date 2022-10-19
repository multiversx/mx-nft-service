import { Nft, NftMetadata } from 'src/common';
import { NftRarityEntity } from 'src/db/nft-rarity';
import { Rarity } from 'src/modules/assets/models/Rarity';
import { CustomRank } from './custom-rank.model';

export class NftRarityData {
  identifier: string;
  nonce: number;

  metadata: NftMetadata;
  DNA?: number[];

  rarities: Rarity;

  constructor(init?: Partial<NftRarityData>) {
    Object.assign(this, init);
  }

  static fromNft(nft: Nft): NftRarityData {
    if (!nft) {
      return undefined;
    }

    return nft
      ? {
          identifier: nft.identifier,
          nonce: nft.nonce,
          metadata: nft.metadata,
          rarities: Rarity.fromNftRarity(nft),
        }
      : null;
  }

  static fromElasticNft(nft: any): NftRarityData {
    return nft
      ? {
          identifier: nft.identifier,
          nonce: nft.nonce,
          metadata: undefined,
          rarities: Rarity.fromElasticNftRarity(nft),
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
      Number(nftRarityData.rarities.openRarityScore) !==
        Number(nftRarityEntity.score_openRarity) ||
      nftRarityData.rarities.openRarityRank !== nftRarityEntity.rank_openRarity
    ) {
      return false;
    }
    if (
      Number(nftRarityData.rarities.jaccardDistancesScore) !==
        Number(nftRarityEntity.score_jaccardDistances) ||
      nftRarityData.rarities.jaccardDistancesRank !==
        nftRarityEntity.rank_jaccardDistances
    ) {
      return false;
    }
    if (
      Number(nftRarityData.rarities.statisticalScore) !==
        Number(nftRarityEntity.score_statistical) ||
      nftRarityData.rarities.statisticalRank !==
        nftRarityEntity.rank_statistical
    ) {
      return false;
    }
    if (
      Number(nftRarityData.rarities.traitScore) !==
        Number(nftRarityEntity.score_trait) ||
      nftRarityData.rarities.traitRank !== nftRarityEntity.rank_trait
    ) {
      return false;
    }
    return true;
  }

  static setCustomRanks(
    nfts: NftRarityData[],
    customRanks: CustomRank[],
  ): NftRarityData[] {
    for (let nft of nfts) {
      const customRank = customRanks.find(
        (cr) => cr.identifier === nft.identifier,
      );
      nft.rarities.customRank = customRank.rank;
    }
    return nfts;
  }
}
