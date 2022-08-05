import { PerformanceProfiler } from '@elrondnetwork/erdnest';
import { Injectable } from '@nestjs/common';
import { NftRarityEntity } from 'src/db/nft-rarity';
import { NftRarityData } from './nft-rarity-data.model';

@Injectable()
export class NftRarityComputeService {
  /// https://nftgo.medium.com/the-ultimate-guide-to-nftgos-new-rarity-model-3f2265dd0e23
  async computeJaccardDistancesRarities(
    collection: string,
    nfts: NftRarityData[],
  ): Promise<NftRarityEntity[]> {
    if (nfts.length === 1) {
      return [
        new NftRarityEntity({
          collection: collection,
          identifier: nfts[0].identifier,
          score: 100,
          nonce: nfts[0].nonce,
          rank: 1,
        }),
      ];
    }

    const nftsWithMaps = this.computeNftsAttributeMaps(nfts);

    const jaccardDistances: number[][] = await this.computeJd(nftsWithMaps);
    const avg: number[] = this.computeAvg(jaccardDistances);
    const scoreArray: number[] = this.computeScore(avg);

    let scoreArrayAsc: number[] = [...scoreArray].sort((a, b) => a - b);

    return nftsWithMaps.map((nft, i) => {
      const scoreIndex = scoreArrayAsc.indexOf(scoreArray[i]);
      scoreArrayAsc = this.markScoreAsUsed(scoreArrayAsc, scoreIndex);

      return new NftRarityEntity({
        collection: collection,
        identifier: nft.identifier,
        score: parseFloat(scoreArray[i].toFixed(3)),
        nonce: nft.nonce,
        rank: scoreArray.length - scoreIndex,
      });
    });
  }

  private async computeJd(nfts: NftRarityData[]): Promise<number[][]> {
    let jaccardDistances: number[][] = [];

    for (let i = 0; i < nfts.length; i++) {
      jaccardDistances[i] = await this.computePartialJd(i, nfts);
    }

    return jaccardDistances;
  }

  private async computePartialJd(
    i: number,
    nfts: NftRarityData[],
  ): Promise<number[]> {
    let jaccardDistances: number[] = [];

    for (let j = 0; j < i; j++) {
      const commonTraitsCount = this.getCommonTraitsCountFromAttributeMaps(
        nfts[i].attributesMap,
        nfts[j].attributesMap,
      );

      const uniqueTraitsCount =
        nfts[i].attributesCount + nfts[j].attributesCount - commonTraitsCount;

      const jaccardIndex = commonTraitsCount / uniqueTraitsCount;

      jaccardDistances[j] = 1 - jaccardIndex;
    }

    return jaccardDistances;
  }

  private computeAvg(jaccardDistances: number[][]): number[] {
    let avg: number[] = [];
    for (let i = 0; i < jaccardDistances.length; i++) {
      avg[i] = 0;
      for (let j = 0; j < jaccardDistances.length; j++) {
        if (i === j) continue;
        avg[i] +=
          (i > j ? jaccardDistances[i]?.[j] : jaccardDistances[j]?.[i]) || 0;
      }
      const realLength = jaccardDistances.length - 1;
      if (avg[i] > 0) avg[i] /= realLength;
    }

    return avg;
  }

  private computeScore(avg: number[]): number[] {
    let scores: number[] = [];

    const avgMax: number = Math.max(...avg);
    const avgMin: number = Math.min(...avg);
    const avgDiff: number = avgMax - avgMin;

    for (let i = 0; i < avg.length; i++) {
      scores[i] = this.isUniqueByAvg(avg[i], avgDiff)
        ? 100
        : ((avg[i] - avgMin) / avgDiff) * 100;
    }

    return scores;
  }

  private isUniqueByAvg(avg: number, avgDiff: number): boolean {
    return (
      avg === undefined ||
      avg === null ||
      Number(avg) === 0 ||
      Number(avgDiff) === 0 ||
      !isFinite(Number(avgDiff))
    );
  }

  private markScoreAsUsed(scoreArray: number[], scoreIndex: number): number[] {
    scoreArray[scoreIndex] = -1;
    return scoreArray;
  }

  private getCommonTraitsCountFromAttributeMaps(
    map1: number[],
    map2: number[],
  ): number {
    let count = 0;
    for (let i = 0; i < map1.length; i++) {
      if (map1[i] === map2[i] && map1[i] !== undefined) count++;
    }
    return count;
  }

  private computeNftsAttributeMaps(nfts: NftRarityData[]): NftRarityData[] {
    let newNftsArray: NftRarityData[] = JSON.parse(JSON.stringify(nfts));

    let traitTypeIndexes: number[] = [];
    let attributeIndexes: number[][] = [];

    for (let nft of newNftsArray) {
      nft.attributesMap = [];

      for (const [key, value] of Object.entries(nft.metadata.attributes)) {
        const traitType = value.trait_type;
        const traitValue = value.value;

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

        nft.attributesMap[traitIndex] = attributeIndex;
      }

      nft.attributesCount = nft.metadata.attributes.length;

      nft.metadata = null;
    }

    return newNftsArray;
  }

  private getOrSetTraitIndex(
    traitTypeIndexes: number[],
    traitType: string,
  ): number {
    if (traitTypeIndexes[traitType] === undefined) {
      traitTypeIndexes[traitType] = Object.entries(traitTypeIndexes).length;
    }

    return traitTypeIndexes[traitType];
  }

  private getOrSetAttributeIndex(
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
