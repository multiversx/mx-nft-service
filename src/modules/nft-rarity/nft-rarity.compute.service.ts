import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { Nft } from 'src/common';
import { NftRarityEntity } from 'src/db/nft-rarity';
import { forceClearGC } from 'src/utils/helpers';

@Injectable()
export class NftRarityComputeService {
  async computeJaccardDistancesRarities(
    nfts: Nft[],
  ): Promise<NftRarityEntity[]> {
    forceClearGC();

    const avg: BigNumber[] = this.computeAvg(nfts);

    forceClearGC();

    const scoreArray: BigNumber[] = this.computeScore(avg);

    let scoreArray_asc: BigNumber[] = [...scoreArray].sort(function (a, b) {
      return new BigNumber(a).comparedTo(b);
    });

    forceClearGC();

    return nfts.map((nft, i) => {
      const scoreIndex = scoreArray_asc.indexOf(scoreArray[i]);
      scoreArray_asc = this.markScoreAsUsed(scoreArray_asc, scoreIndex);

      return new NftRarityEntity({
        collection: nft.collection,
        identifier: nft.identifier,
        score: new BigNumber(scoreArray[i].toFixed(3)).toNumber(),
        nonce: nft.nonce,
        rank: scoreArray.length - scoreIndex,
      });
    });
  }

  private computeAvg(nfts: Nft[]): BigNumber[] {
    let jd: BigNumber[][] = [];
    let avg: BigNumber[] = [];

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

          jd[i][j] = new BigNumber(1).minus(
            new BigNumber(commonTraitsCnt).dividedBy(uniqueTraitsCnt),
          );
        }
      }

      if (jd.length !== 0) {
        // PS: length-1 because there's always an empty cell in matrix, where i == j
        // the final rarities ranks are the same, but this way is more correct
        avg[i] = jd[i]
          .reduce((a, b) => new BigNumber(a).plus(b), new BigNumber(0))
          .dividedBy(jd[i].length - 1);
      } else avg[i] = new BigNumber(0);
    }

    return avg;
  }

  private computeScore(avg: BigNumber[]): BigNumber[] {
    let scores: BigNumber[] = [];
    const avgMax: BigNumber = BigNumber.max(...avg);
    const avgMin: BigNumber = BigNumber.min(...avg);

    for (let i = 0; i < avg.length; i++) {
      scores[i] = this.isUniqueByAvg(avg[i], avgMin, avgMax)
        ? new BigNumber(100)
        : avg[i]
            .minus(avgMin)
            .dividedBy(avgMax.minus(avgMin))
            .multipliedBy(100);
    }
    return scores;
  }

  private isUniqueByAvg(
    avg: BigNumber,
    avgMin: BigNumber,
    avgMax: BigNumber,
  ): boolean {
    return !avgMax.minus(avgMin).isFinite() || avg.isNaN() || avg.isZero();
  }

  private markScoreAsUsed(
    scoreArray: BigNumber[],
    scoreIndex: number,
  ): BigNumber[] {
    scoreArray[scoreIndex] = new BigNumber(-1);
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
