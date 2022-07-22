import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { NftRarityEntity } from 'src/db/nft-rarity';
import { NftRarityData } from './nft-rarity-data.model';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';

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

    nfts = this.computeNftsAttributeMaps(nfts);

    const jaccardDistances: number[][] = await this.computeJd(nfts);
    const avg: number[] = this.computeAvg(jaccardDistances);
    const scoreArray: number[] = this.computeScore(avg);

    let scoreArrayAsc: number[] = [...scoreArray].sort((a, b) => a - b);

    return nfts.map((nft, i) => {
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

  private computeNftsAttributeMaps(nfts: NftRarityData[]): NftRarityData[] {
    let traitTypeIndexes: number[] = [];
    let attributeIndexes: number[][] = [];

    for (let nft of nfts) {
      nft.attributesMap = [];

      for (const [key, value] of Object.entries(nft.metadata.attributes)) {
        const traitType = value.trait_type;
        const traitValue = value.value;

        let traitIndex: number = null;
        let attributeIndex: number = null;

        if (traitTypeIndexes[traitType] === undefined) {
          traitIndex = Object.entries(traitTypeIndexes).length;
          traitTypeIndexes[traitType] = traitIndex;
        } else {
          traitIndex = traitTypeIndexes[traitType];
        }

        if (attributeIndexes?.[traitIndex] === undefined) {
          attributeIndexes[traitIndex] = [];
        }

        if (attributeIndexes[traitIndex][traitValue] === undefined) {
          attributeIndex = Object.entries(attributeIndexes[traitIndex]).length;
          attributeIndexes[traitIndex][traitValue] = attributeIndex;
        } else {
          attributeIndex = attributeIndexes[traitIndex][traitValue];
        }

        nft.attributesMap[traitIndex] = attributeIndex;
      }
      nft.attributesCount = nft.metadata.attributes.length;
      nft.metadata = null;
    }

    return nfts;
  }

  private async computeJd(nfts: NftRarityData[]): Promise<number[][]> {
    const profiler = new PerformanceProfiler();

    let jaccardDistances: number[][] = [];
    let jaccardPromises: Promise<number[]>[] = [];
    for (let i = 0; i < nfts.length; i++) {
      jaccardDistances[i] = await this.computePartialJd(i, nfts);
    }

    await Promise.all(jaccardPromises);

    profiler.stop();
    console.log(`computeJd duration ${profiler.duration}`);

    return jaccardDistances;
  }

  private async computePartialJd(
    i: number,
    nfts: NftRarityData[],
  ): Promise<number[]> {
    const profiler = new PerformanceProfiler();
    let jaccardDistances: number[] = [];
    for (let j = 0; j < i; j++) {
      const commonTraitsCount = this.getCommonTraitsCountFromAttributeMaps(
        nfts[i].attributesMap,
        nfts[j].attributesMap,
      );

      const uniqueTraitsCount =
        nfts[i].attributesCount + nfts[j].attributesCount - commonTraitsCount;

      const jaccardIndex: BigNumber = new BigNumber(
        commonTraitsCount,
      ).dividedBy(uniqueTraitsCount);

      jaccardDistances[j] = parseFloat(
        new BigNumber(1).minus(jaccardIndex).toFixed(15),
      );
    }
    profiler.stop();
    //if (i > 1000) console.log(`computePartialJd duration ${profiler.duration}`);
    return jaccardDistances;
  }

  private computeAvg(jaccardDistances: number[][]): number[] {
    const profiler = new PerformanceProfiler();

    let avg: number[] = [];
    for (let i = 0; i < jaccardDistances.length; i++) {
      avg[i] = 0;
      for (let j = 0; j < jaccardDistances.length; j++) {
        if (i === j) continue;
        avg[i] +=
          (i > j ? jaccardDistances[i]?.[j] : jaccardDistances[j]?.[i]) || 0;
      }
      const realLength = jaccardDistances.length - 1;
      if (avg[i] > 0)
        avg[i] = parseFloat(
          new BigNumber(avg[i]).dividedBy(realLength).toFixed(15),
        );
    }

    profiler.stop();
    console.log(`computeAvg duration ${profiler.duration}`);

    return avg;
  }

  private computeScore(avg: number[]): number[] {
    const profiler = new PerformanceProfiler();

    let scores: number[] = [];
    const avgMax: number = Math.max(...avg);
    const avgMin: number = Math.min(...avg);

    for (let i = 0; i < avg.length; i++) {
      scores[i] = this.isUniqueByAvg(avg[i], avgMin, avgMax)
        ? 100
        : parseFloat(
            new BigNumber(avg[i])
              .minus(avgMin)
              .dividedBy(new BigNumber(avgMax).minus(avgMin))
              .multipliedBy(100)
              .toFixed(15),
          );
    }

    profiler.stop();
    console.log(`computeScore duration ${profiler.duration}`);

    return scores;
  }

  private isUniqueByAvg(avg: number, avgMin: number, avgMax: number): boolean {
    return (
      !isFinite(avgMax - avgMin) ||
      avgMax - avgMin === 0 ||
      isNaN(avg) ||
      avg === 0
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
      if (map1[i] === map2[i]) count++;
    }
    return count;
  }
}
