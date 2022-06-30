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
        score: scoreArray[i].toNumber(),
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
        if (i == j) continue;

        if (z[i] == null) {
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

      // ps: length-1 because there's always an empty cell in matrix, where i == j
      avg[i] = z[i]
        .reduce((a, b) => new BigNumber(a).plus(b), new BigNumber(0))
        .dividedBy(z[i].length - 1);
    }

    return avg;
  }

  private computeJD(avg: BigNumber[]): BigNumber[] {
    let jd: BigNumber[] = [];
    let avgMax: BigNumber = BigNumber.max(...avg);
    let avgMin: BigNumber = BigNumber.min(...avg);
    for (let i = 0; i < avg.length; i++) {
      jd[i] = avg[i]
        .minus(avgMin)
        .dividedBy(avgMax.minus(avgMin))
        .multipliedBy(100);
    }
    return jd;
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
