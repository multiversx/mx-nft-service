import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { Nft } from 'src/common';
import { NftRarityEntity } from 'src/db/nft-rarity';

@Injectable()
export class NftRarityComputeService {
  async computeJaccardDistancesRarities(
    nfts: Nft[],
  ): Promise<NftRarityEntity[]> {
    const avg: BigNumber[] = this.computeAvg(nfts);

    const scoreArray: BigNumber[] = this.computeJD(avg);

    let scoreArray_asc: BigNumber[] = [...scoreArray].sort(function (a, b) {
      return new BigNumber(a).comparedTo(b);
    });

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
    let z: BigNumber[][] = [];
    let avg: BigNumber[] = [];

    for (let i = 0; i < nfts.length; i++) {
      for (let j = 0; j < nfts.length; j++) {
        if (i === j) continue;

        if (z[i] === undefined) {
          z[i] = [];
        }

        if (z[i][j] == null || z[j][i] == null) {
          const commonTraitsCnt = this.getCommonTraitsCnt(
            nfts[i].metadata.attributes,
            nfts[j].metadata.attributes,
          );
          const uniqueTraitsCnt = this.getUniqueTraitsCnt(
            nfts[i].metadata.attributes,
            nfts[j].metadata.attributes,
          );

          z[i][j] = new BigNumber(commonTraitsCnt).dividedBy(uniqueTraitsCnt);
        }
      }

      // PS: length-1 because there's always an empty cell in matrix, where i == j
      // the final rarities ranks are the same, but this way is more correct
      if (z.length !== 0) {
        avg[i] = z[i]
          .reduce((a, b) => new BigNumber(a).plus(b), new BigNumber(0))
          .dividedBy(z[i].length - 1);
      } else avg[i] = new BigNumber(0);
    }

    return avg;
  }

  private computeJD(avg: BigNumber[]): BigNumber[] {
    let jd: BigNumber[] = [];
    let avgMax: BigNumber = BigNumber.max(...avg);
    let avgMin: BigNumber = BigNumber.min(...avg);

    for (let i = 0; i < avg.length; i++) {
      jd[i] = this.isUniqueByAvg(avg[i], avgMin, avgMax)
        ? new BigNumber(100)
        : avg[i]
            .minus(avgMin)
            .dividedBy(avgMax.minus(avgMin))
            .multipliedBy(100);
    }
    return jd;
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

  private getUniqueTraitsCnt(
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
    return [...new Set(arr1.concat(arr2))].length;
  }
}
