import { Injectable } from '@nestjs/common';
import { NftRarityEntity } from 'src/db/nft-rarity';
import { NftRarityData } from '../models/nft-rarity-data.model';

/// https://nftgo.medium.com/the-ultimate-guide-to-nftgos-new-rarity-model-3f2265dd0e23

@Injectable()
export class JaccardDistancesRarityService {
  async computeJaccardDistancesRarities(
    collection: string,
    nfts: NftRarityData[],
  ): Promise<{ [key: string]: { [key: string]: number } }> {
    if (nfts.length === 1) {
      return {
        [nfts[0].nonce]: {
          jdScore: 100,
          jdRank: 1,
        },
      };
      // return [
      //   new NftRarityEntity({
      //     collection: collection,
      //     identifier: nfts[0].identifier,
      //     jdScore: 100,
      //     nonce: nfts[0].nonce,
      //     jdRank: 1,
      //   }),
      // ];
    }

    //const nftsWithMaps = this.computeNftsAttributeMaps(nfts);

    const jaccardDistances: number[][] = await this.computeJd(nfts);
    const avg: number[] = this.computeAvg(jaccardDistances);
    const scoreArray: number[] = this.computeScore(avg);

    let scoreArrayAsc: number[] = [...scoreArray].sort((a, b) => a - b);

    let rarities = {};
    nfts.map((nft, i) => {
      const scoreIndex = scoreArrayAsc.indexOf(scoreArray[i]);
      scoreArrayAsc = this.markScoreAsUsed(scoreArrayAsc, scoreIndex);

      rarities[nft.nonce] = {
        jdScore: parseFloat(scoreArray[i].toFixed(3)),
        jdRank: scoreArray.length - scoreIndex,
      };

      // return new NftRarityEntity({
      //   collection: collection,
      //   identifier: nft.identifier,
      //   nonce: nft.nonce,
      //   jdScore: parseFloat(scoreArray[i].toFixed(3)),
      //   jdRank: scoreArray.length - scoreIndex,
      // });
    });
    return rarities;
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
        nfts[i].DNA,
        nfts[j].DNA,
      );

      const uniqueTraitsCount =
        nfts[i].DNA.length + nfts[j].DNA.length - commonTraitsCount;

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
}
