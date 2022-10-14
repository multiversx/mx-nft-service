import { Injectable } from '@nestjs/common';
import { NftRarityEntity } from 'src/db/nft-rarity';
import { JaccardDistancesRarityService } from './algorithms/jaccard-distances.service';
import { NftRarityData } from './models/nft-rarity-data.model';

@Injectable()
export class NftRarityComputeService {
  constructor(
    private readonly jaccardDistancesService: JaccardDistancesRarityService,
  ) {}

  async computeRarities(
    collection: string,
    nfts: NftRarityData[],
  ): Promise<NftRarityEntity[]> {
    let rarities: { [key: number]: { [key: number]: number } } = {};

    const jdRarities: { [key: string]: { [key: string]: number } } =
      await this.jaccardDistancesService.computeJaccardDistancesRarities(
        collection,
        nfts,
      );
    console.log(jdRarities);

    const dnaSummary: { [key: string]: { [key: string]: number } } =
      this.computeDNASummary(nfts);

    console.log(dnaSummary);

    return nfts.map((nft) => {
      return new NftRarityEntity({
        collection: collection,
        identifier: nft.identifier,
        nonce: nft.nonce,
        jdScore: jdRarities[nft.nonce].jdScore,
        jdRank: jdRarities[nft.nonce].jdRank,
      });
    });
  }

  private computeDNASummary(nfts: NftRarityData[]): {
    [key: string]: { [key: string]: number };
  } {
    let dnaSummary = {};

    for (const nft of nfts) {
      for (let i = 0; i < nft.DNA.length; i++) {
        if (!dnaSummary[i]) {
          dnaSummary[i] = {};
        }

        if (!dnaSummary[i][nft.DNA[i]]) {
          dnaSummary[i][nft.DNA[i]] = {
            occurences: 0,
            occurencesPercentage: 0,
          };
        }

        dnaSummary[i][nft.DNA[i]].occurences++;
        dnaSummary[i][nft.DNA[i]].occurencesPercentage =
          (dnaSummary[i][nft.DNA[i]].occurences * 100) / nfts.length;
      }
    }

    return dnaSummary;
  }
}
