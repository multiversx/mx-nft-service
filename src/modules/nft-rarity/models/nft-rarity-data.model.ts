import { Nft, NftMetadata } from 'src/common';
import { NftRarityEntity } from 'src/db/nft-rarity';
import { Rarity } from 'src/modules/assets/models/Rarity';
import { CustomRank } from './custom-rank.model';

export class NftRarityData {
  identifier: string;
  nonce: number;

  temporaryMetadata?: NftMetadata;
  DNA?: number[];

  rarities: Rarity;
  hasRarity?: boolean;

  constructor(init?: Partial<NftRarityData>) {
    Object.assign(this, init);
  }

  private static fromNft(nft: Nft): NftRarityData {
    if (!nft) {
      return undefined;
    }

    if (typeof nft.metadata === 'string') {
      try {
        nft.metadata = JSON.parse(nft.metadata);
      } catch {}
    }

    return nft
      ? new NftRarityData({
          identifier: nft.identifier,
          nonce: nft.nonce,
          temporaryMetadata: nft.metadata,
          rarities: Rarity.fromNftRarity(nft),
        })
      : null;
  }

  private static fromElasticNft(nft: any): NftRarityData {
    return nft
      ? new NftRarityData({
          identifier: nft.identifier,
          nonce: nft.nonce,
          temporaryMetadata: undefined,
          rarities: Rarity.fromElasticNftRarity(nft),
          hasRarity: nft.nft_hasRarity,
        })
      : null;
  }

  private static fromDbNft(nft: NftRarityEntity): NftRarityData {
    return nft
      ? new NftRarityData({
          identifier: nft.identifier,
          nonce: nft.nonce,
          rarities: Rarity.fromDbRarity(nft),
        })
      : null;
  }

  static fromNfts(
    nfts: Nft[],
    traitTypeIndexes: number[] = [],
    attributeIndexes: number[][] = [],
  ): [NftRarityData[], number[], number[][]] {
    return this.computeDNA(
      nfts.map((nft) => this.fromNft(nft)),
      traitTypeIndexes,
      attributeIndexes,
    );
  }

  static fromElasticNfts(nfts: any[]): NftRarityData[] {
    return this.computeDNA(nfts.map((nft) => this.fromElasticNft(nft)))[0];
  }

  static fromDbNfts(nfts: NftRarityEntity[]): NftRarityData[] {
    return nfts.map((nft) => this.fromDbNft(nft));
  }

  static computeDNA(
    nfts: NftRarityData[],
    traitTypeIndexes: number[] = [],
    attributeIndexes: number[][] = [],
  ): [NftRarityData[], number[], number[][]] {
    let nftsWithDNA: NftRarityData[] = JSON.parse(JSON.stringify(nfts));

    for (let nft of nftsWithDNA) {
      nft.DNA = [];

      if (!nft.temporaryMetadata || !nft.temporaryMetadata.attributes) {
        continue;
      }

      for (const [key, attribute] of Object.entries(nft.temporaryMetadata.attributes)) {
        if ((attribute.trait_type === undefined && attribute.name === undefined) || attribute.value === undefined) {
          continue;
        }

        const traitType = String(attribute.trait_type ?? attribute.name);
        const traitValue = String(attribute.value);

        if (traitValue.toLowerCase() === 'none' || traitValue === '') {
          continue;
        }

        let traitIndex: number = null;
        let attributeIndex: number = null;

        traitIndex = this.getOrSetTraitIndex(traitTypeIndexes, traitType);

        attributeIndex = this.getOrSetAttributeIndex(attributeIndexes, traitIndex, traitValue);

        nft.DNA[traitIndex] = attributeIndex;
      }

      delete nft.temporaryMetadata;
    }

    return [nftsWithDNA, traitTypeIndexes, attributeIndexes];
  }

  static getOrSetTraitIndex(traitTypeIndexes: number[], traitType: string): number {
    if (traitTypeIndexes[traitType] === undefined) {
      traitTypeIndexes[traitType] = Object.entries(traitTypeIndexes).length;
    }

    return traitTypeIndexes[traitType];
  }

  static getOrSetAttributeIndex(attributeIndexes: number[][], traitIndex: number, traitValue: string): number {
    if (attributeIndexes?.[traitIndex] === undefined) {
      attributeIndexes[traitIndex] = [];
    }

    if (attributeIndexes[traitIndex][traitValue] === undefined) {
      attributeIndexes[traitIndex][traitValue] = Object.entries(attributeIndexes[traitIndex]).length;
    }

    return attributeIndexes[traitIndex][traitValue];
  }

  static areIdenticalRarities(nftRarityData: NftRarityData, nftRarityEntity: NftRarityEntity): boolean {
    if (
      Number(nftRarityData.rarities.openRarityScore) !== Number(nftRarityEntity.score_openRarity) ||
      nftRarityData.rarities.openRarityRank !== nftRarityEntity.rank_openRarity
    ) {
      return false;
    }
    if (
      Number(nftRarityData.rarities.jaccardDistancesScore) !== Number(nftRarityEntity.score_jaccardDistances) ||
      nftRarityData.rarities.jaccardDistancesRank !== nftRarityEntity.rank_jaccardDistances
    ) {
      return false;
    }
    if (
      Number(nftRarityData.rarities.statisticalScore) !== Number(nftRarityEntity.score_statistical) ||
      nftRarityData.rarities.statisticalRank !== nftRarityEntity.rank_statistical
    ) {
      return false;
    }
    if (
      Number(nftRarityData.rarities.traitScore) !== Number(nftRarityEntity.score_trait) ||
      nftRarityData.rarities.traitRank !== nftRarityEntity.rank_trait
    ) {
      return false;
    }
    return true;
  }

  static setCustomRanks(nfts: NftRarityData[], customRanks: CustomRank[]): NftRarityData[] {
    for (let nft of nfts) {
      const customRank = customRanks.find((cr) => cr.identifier === nft.identifier);
      nft.rarities.customRank = customRank.rank;
    }
    return nfts;
  }
}
