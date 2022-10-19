import { Injectable } from '@nestjs/common';
import { NftRarityEntity } from 'src/db/nft-rarity';
import { JaccardDistancesRarityService } from './algorithms/jaccard-distances.service';
import { OpenRarityService } from './algorithms/open-rarity.service';
import { TraitAndStatisticalRarityService } from './algorithms/trait-and-statistical-rarity.service';
import { NftRarityData } from './models/nft-rarity-data.model';
import { RarityAlgorithmsEnum } from './models/rarity-algortihms.enum';

@Injectable()
export class NftRarityComputeService {
  constructor(
    private readonly jaccardDistancesService: JaccardDistancesRarityService,
    private readonly traitAndStatisticalRarityService: TraitAndStatisticalRarityService,
    private readonly openRarityService: OpenRarityService,
  ) {}

  async computeRarities(
    collection: string,
    nfts: NftRarityData[],
  ): Promise<NftRarityEntity[]> {
    const jdRarities: { [key: string]: { [key: string]: number } } =
      await this.jaccardDistancesService.computeJaccardDistancesRarities(nfts);

    const dnaSummary: {
      [key: string]: { [key: string]: { [key: string]: number } };
    } = this.computeDNASummary(nfts);

    const openRarities = this.openRarityService.computeOpenRarities(
      nfts,
      dnaSummary,
    );

    const tsrRarities: { [key: string]: { [key: string]: number } } =
      await this.traitAndStatisticalRarityService.computeTraitAndStatisticalRarities(
        nfts,
        dnaSummary,
        [
          RarityAlgorithmsEnum.TraitRarity,
          RarityAlgorithmsEnum.StatisticalRarity,
        ],
      );

    return nfts.map((nft) => {
      const nonce = nft.nonce;
      return new NftRarityEntity({
        collection: collection,
        identifier: nft.identifier,
        nonce: nonce,
        score_openRarity: parseFloat(openRarities[nonce].sum.toFixed(3)),
        rank_openRarity: openRarities[nonce].rank,
        score_jaccardDistances: parseFloat(jdRarities[nonce].score.toFixed(3)),
        rank_jaccardDistances: jdRarities[nonce].rank,
        score_trait: parseFloat(tsrRarities[nonce].traitScore.toFixed(3)),
        rank_trait: tsrRarities[nonce].traitRank,
        score_statistical: parseFloat(
          tsrRarities[nonce].statisticalScore.toFixed(3),
        ),
        rank_statistical: tsrRarities[nonce].statisticalRank,
      });
    });
  }

  private computeDNASummary(nfts: NftRarityData[]): {
    [key: string]: { [key: string]: { [key: string]: number } };
  } {
    let dnaSummary = {};

    let totalAttributesCount = 0;

    for (const nft of nfts) {
      for (let traitKey = 0; traitKey < nft.DNA.length; traitKey++) {
        if (!dnaSummary[traitKey]) {
          dnaSummary[traitKey] = {
            occurences: 0,
            occurencesPercentage: 0,
          };
        }

        const attributeKey = nft.DNA[traitKey];

        if (!Number.isNaN(attributeKey)) {
          if (!dnaSummary[traitKey][attributeKey]) {
            dnaSummary[traitKey][attributeKey] = {
              occurences: 0,
              occurencesPercentage: 0,
            };
            totalAttributesCount++;
          }

          dnaSummary[traitKey].occurences++;
          dnaSummary[traitKey][attributeKey].occurences++;
        }
      }
    }

    for (const [traitKey, traitProperties] of Object.entries(dnaSummary)) {
      dnaSummary[traitKey].occurencesPercentage =
        (dnaSummary[traitKey].occurences / nfts.length) * 100;

      for (const [traitPropertyKey] of Object.entries(traitProperties)) {
        const attributeKey = parseInt(traitPropertyKey);
        if (!Number.isNaN(attributeKey)) {
          dnaSummary[traitKey][attributeKey].occurencesPercentage =
            (dnaSummary[traitKey][attributeKey].occurences / nfts.length) * 100;
          dnaSummary[traitKey][attributeKey].frequency =
            dnaSummary[traitKey][attributeKey].occurences / nfts.length;
          dnaSummary[traitKey][attributeKey].rarity =
            nfts.length / dnaSummary[traitKey][attributeKey].occurences;
        }
      }
    }

    return dnaSummary;
  }
}
