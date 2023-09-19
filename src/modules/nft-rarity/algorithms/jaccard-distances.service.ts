import { Injectable } from '@nestjs/common';
import { sleep } from 'src/utils/helpers';
import { NftRarityData } from '../models/nft-rarity-data.model';

// https://nftgo.medium.com/the-ultimate-guide-to-nftgos-new-rarity-model-3f2265dd0e23

@Injectable()
export class JaccardDistancesRarityService {
  async computeJaccardDistancesRarities(nfts: NftRarityData[]): Promise<{ [key: string]: { [key: string]: number } }> {
    if (nfts.length === 1) {
      return {
        [nfts[0].nonce]: {
          score: 100,
          rank: 1,
        },
      };
    }

    const avg: number[] = await this.computeAvgUsingJaccardDistances(nfts);
    const scoreArray: number[] = this.computeScore(avg);
    let scoreArrayAsc: number[] = [...scoreArray].sort((a, b) => a - b);

    let rarities = {};
    nfts.map((nft, i) => {
      const scoreIndex = scoreArrayAsc.indexOf(scoreArray[i]);
      scoreArrayAsc = this.markScoreAsUsed(scoreArrayAsc, scoreIndex);

      rarities[nft.nonce] = {
        score: scoreArray[i],
        rank: scoreArray.length - scoreIndex,
      };
    });
    return rarities;
  }

  private async computeAvgUsingJaccardDistances(nfts: NftRarityData[]): Promise<number[]> {
    let avg: number[] = [];

    let jdSumArray: number[] = [];

    for (let i = 0; i < nfts.length; i++) {
      for (let j = 0; j < i; j++) {
        const commonTraitsCount = this.getCommonTraitsCountFromDna(nfts[i].DNA, nfts[j].DNA);

        const uniqueTraitsCount = this.getUniqueTraitsCountFromDna(nfts[i].DNA, nfts[j].DNA, commonTraitsCount);

        const jaccardIndex = commonTraitsCount / uniqueTraitsCount;

        const jaccardDistance = 1 - jaccardIndex;

        if (jdSumArray[i]) {
          jdSumArray[i] += jaccardDistance;
        } else {
          jdSumArray[i] = jaccardDistance;
        }

        if (jdSumArray[j]) {
          jdSumArray[j] += jaccardDistance;
        } else {
          jdSumArray[j] = jaccardDistance;
        }
      }

      if (i > 5000) {
        await sleep(0.001);
      }
    }

    const realLength = nfts.length - 1;
    for (let i = 0; i < nfts.length; i++) {
      avg[i] = jdSumArray[i] > 0 ? jdSumArray[i] / realLength : 0;
    }

    return avg;
  }

  private computeScore(avg: number[]): number[] {
    let scores: number[] = [];

    const avgMax: number = Math.max(...avg);
    const avgMin: number = Math.min(...avg);
    const avgDiff: number = avgMax - avgMin;

    for (let i = 0; i < avg.length; i++) {
      scores[i] = this.isUniqueByAvg(avg[i], avgDiff) ? 100 : ((avg[i] - avgMin) / avgDiff) * 100;
    }

    return scores;
  }

  private isUniqueByAvg(avg: number, avgDiff: number): boolean {
    return avg === undefined || avg === null || Number(avg) === 0 || Number(avgDiff) === 0 || !isFinite(Number(avgDiff));
  }

  private markScoreAsUsed(scoreArray: number[], scoreIndex: number): number[] {
    scoreArray[scoreIndex] = -1;
    return scoreArray;
  }

  private getCommonTraitsCountFromDna(dna1: number[], dna2: number[]): number {
    let count = 0;
    for (let i = 0; i < dna1.length; i++) {
      if (dna1[i] === dna2[i] && Number.isInteger(dna1[i])) count++;
    }
    return count;
  }

  private getUniqueTraitsCountFromDna(dna1: number[], dna2: number[], commonTraitsCount: number): number {
    return dna1.filter((dna) => Number.isInteger(dna)).length + dna2.filter((dna) => Number.isInteger(dna)).length - commonTraitsCount;
  }
}
