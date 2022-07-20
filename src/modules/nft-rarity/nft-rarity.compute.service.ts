import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
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

    const scoreArray: number[] = this.computeScore(
      this.computeAvg(this.computeJd(nfts)),
    );

    let scoreArray_asc: number[] = [...scoreArray].sort(function (a, b) {
      return a - b;
    });

    return nfts.map((nft, i) => {
      const scoreIndex = scoreArray_asc.indexOf(scoreArray[i]);
      scoreArray_asc = this.markScoreAsUsed(scoreArray_asc, scoreIndex);

      return new NftRarityEntity({
        collection: collection,
        identifier: nft.identifier,
        score: parseFloat(scoreArray[i].toFixed(3)),
        nonce: nft.nonce,
        rank: scoreArray.length - scoreIndex,
      });
    });
  }

  private computeJd(nfts: NftRarityData[]): number[][] {
    let jd: number[][] = [];
    for (let i = 0; i < nfts.length; i++) {
      for (let j = 0; j < i; j++) {
        if (jd[i] === undefined) {
          jd[i] = [];
        }

        if (jd[i][j] === undefined) {
          const commonTraitsCnt = this.getCommonTraitsCnt(
            nfts[i].metadata.attributes,
            nfts[j].metadata.attributes,
          );

          const uniqueTraitsCnt =
            nfts[i].metadata.attributes.length +
            nfts[j].metadata.attributes.length -
            commonTraitsCnt;

          const ji: BigNumber = new BigNumber(commonTraitsCnt).dividedBy(
            uniqueTraitsCnt,
          );

          jd[i][j] = parseFloat(new BigNumber(1).minus(ji).toFixed(15));
        }
      }
    }
    return jd;
  }

  private computeAvg(jd: number[][]): number[] {
    let avg: number[] = [];
    for (let i = 0; i < jd.length; i++) {
      avg[i] = 0;
      for (let j = 0; j < jd.length; j++) {
        if (i === j) continue;
        avg[i] += (i > j ? jd[i]?.[j] : jd[j]?.[i]) || 0;
      }
      const realLength = jd.length - 1;
      if (avg[i] > 0)
        avg[i] = parseFloat(
          new BigNumber(avg[i]).dividedBy(realLength).toFixed(15),
        );
    }
    return avg;
  }

  private computeScore(avg: number[]): number[] {
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

  private getCommonTraitsCnt(
    obj1: [{ [key: string]: string }],
    obj2: [{ [key: string]: string }],
  ): number {
    let arr1: string[] = [];
    let arr2: string[] = [];
    for (const [key, value] of Object.entries(obj1)) {
      arr1.push(JSON.stringify(value));
    }
    for (const [key, value] of Object.entries(obj2)) {
      arr2.push(JSON.stringify(value));
    }
    return arr1.filter((e) => {
      return arr2.includes(e);
    }).length;
  }
}
