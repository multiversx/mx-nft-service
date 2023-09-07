import { Injectable } from '@nestjs/common';
import { NftRarityData } from '../models/nft-rarity-data.model';

// https://openrarity.gitbook.io/developers/fundamentals/methodology
// https://en.wikipedia.org/wiki/Information_content

@Injectable()
export class OpenRarityService {
  computeOpenRarities(
    nfts: NftRarityData[],
    dnaSummary: { [key: string]: { [key: string]: { [key: string]: number } } },
  ): { [key: string]: { [key: string]: number } } {
    let rarities = [];

    for (const nft of nfts) {
      rarities[nft.nonce] = {
        sum: 0,
      };
      for (let traitIndex = 0; traitIndex < nft.DNA.length; traitIndex++) {
        if (!Number.isInteger(traitIndex) || !Number.isInteger(nft.DNA[traitIndex])) {
          continue;
        }

        const chanceOfTraitValue = dnaSummary[traitIndex][nft.DNA[traitIndex]].occurencesPercentage / 100;

        rarities[nft.nonce].sum += -Math.log2(chanceOfTraitValue);
      }
    }

    let raritiesObj = {};

    const raritiesSortAsc = [...rarities].sort(function (a, b) {
      return a.sum - b.sum;
    });
    for (let i = 0; i < nfts.length; i++) {
      const nonce = nfts[i].nonce;
      raritiesObj[nonce] = {
        ...rarities[nonce],
        rank: nfts.length - raritiesSortAsc.indexOf(rarities[nonce]),
      };
    }

    return raritiesObj;
  }
}
