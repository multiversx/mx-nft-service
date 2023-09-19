import { Injectable, Logger } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { NftRarityComputeService } from './nft-rarity.compute.service';
import { NftRarityEntity } from '../../db/nft-rarity/nft-rarity.entity';
import { AssetRarityInfoRedisHandler } from '../assets/loaders/assets-rarity-info.redis-handler';
import { NftRarityData } from './models/nft-rarity-data.model';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { CustomRank } from './models/custom-rank.model';
import { NftRarityElasticService } from './nft-rarity.elastic.service';
import { constants } from 'src/config';
import { Locker } from '@multiversx/sdk-nestjs-common';
@Injectable()
export class NftRarityService {
  constructor(
    private readonly logger: Logger,
    private readonly mxApiService: MxApiService,
    private readonly nftRarityElasticService: NftRarityElasticService,
    private readonly persistenceService: PersistenceService,
    private readonly nftRarityComputeService: NftRarityComputeService,
    private readonly assetRarityRedisHandler: AssetRarityInfoRedisHandler,
  ) {
    this.nftRarityElasticService.setElasticRarityMappings();
  }

  async validateRarities(collectionTicker: string): Promise<boolean> {
    this.logger.log(`${collectionTicker} - Validating collection rarities...`);
    let valid = true;

    const [elasticNfts, dbNfts, preferredAlgorithm]: [NftRarityData[], NftRarityEntity[], string] = await Promise.all([
      this.nftRarityElasticService.getAllCollectionNftsFromElastic(collectionTicker),
      this.persistenceService.findNftRarityByCollection(collectionTicker),
      this.mxApiService.getCollectionPreferredAlgorithm(collectionTicker),
    ]);

    const areIdenticalRarities = this.areIdenticalRarities(elasticNfts, dbNfts);
    if (!areIdenticalRarities) {
      const areRaritiesMissingFromElasticOnly = this.areRaritiesMissingFromElasticOnly(elasticNfts, dbNfts);
      if (areRaritiesMissingFromElasticOnly) {
        await this.migrateRaritiesFromDbToElastic(collectionTicker, dbNfts);
        valid = false;
      } else {
        this.logger.log(`${collectionTicker} - Rarities missmatch/missing for => recalculate`, {
          collection: collectionTicker,
        });
        return await this.updateCollectionRarities(collectionTicker);
      }
    }

    if (preferredAlgorithm === 'custom') {
      const [customRanks, customRanksElasticHash]: [CustomRank[], string] = await Promise.all([
        this.mxApiService.getCollectionCustomRanks(collectionTicker),
        this.nftRarityElasticService.getCollectionCustomRanksHash(collectionTicker),
      ]);
      if (customRanks && !CustomRank.areIdenticalHashes(customRanks, customRanksElasticHash)) {
        await this.nftRarityElasticService.setNftCustomRanksInElastic(collectionTicker, customRanks);
        valid = false;
      }
    }

    this.logger.log(`${collectionTicker} - ${valid ? 'Valid' : 'Not valid => Updated'}`);

    return valid;
  }

  async updateCollectionRarities(collectionTicker: string, hasRarities?: boolean): Promise<boolean> {
    this.logger.log(`Updating rarities for ${collectionTicker}...`);
    try {
      const [isCollectionTooBig, nftsCount] = await this.isCollectionTooBig(collectionTicker);
      if (isCollectionTooBig) {
        return false;
      }

      const [[allNfts, customRanks], allNftsFromElastic] = await Promise.all([
        this.getAllCollectionNftsWithCustomRanksFromAPI(collectionTicker, nftsCount),
        this.nftRarityElasticService.getAllCollectionNftsFromElastic(collectionTicker),
      ]);

      if (!allNfts || allNfts.length === 0) {
        this.logger.log(`${collectionTicker} - No NFTs => update collection rarity flag`);
        await this.nftRarityElasticService.setCollectionRarityFlagInElastic(collectionTicker, false, hasRarities);
        return false;
      }

      const nftsWithoutAttributes = this.filterNftsWithoutAttributes(allNfts);
      if (nftsWithoutAttributes?.length > 0) {
        await this.nftRarityElasticService.setNftRaritiesInElastic(nftsWithoutAttributes, false, allNftsFromElastic);
      }

      let nftsWithAttributes = this.filterNftsWithAttributes(allNfts);

      if (nftsWithAttributes?.length === 0) {
        this.logger.log(`${collectionTicker} - Collection has no indexed/valid attributes)`);
        await this.nftRarityElasticService.setCollectionRarityFlagInElastic(collectionTicker, false, hasRarities);
        return false;
      }

      const rarities: NftRarityEntity[] = await this.computeRarities(nftsWithAttributes, collectionTicker, allNfts.length);

      if (!rarities) {
        this.logger.log(`${collectionTicker} - No rarities were computed`);
        await this.nftRarityElasticService.setNftRaritiesInElastic(nftsWithAttributes, false, allNftsFromElastic);
        return false;
      }

      await Promise.all([
        this.persistenceService.saveOrUpdateBulkRarities(rarities),
        this.nftRarityElasticService.setCollectionRarityFlagInElastic(collectionTicker, true, hasRarities),
        this.nftRarityElasticService.setNftRaritiesInElastic(NftRarityData.fromDbNfts(rarities), true, allNftsFromElastic),
        this.nftRarityElasticService.setNftCustomRanksInElastic(collectionTicker, customRanks, allNftsFromElastic),
        this.assetRarityRedisHandler.clearMultipleKeys(rarities.map((r) => r.identifier)),
      ]);

      this.logger.log(`${collectionTicker} - Updated rarities`);

      return true;
    } catch (error) {
      this.logger.log(`Error when trying to update/validate collection rarities for ${collectionTicker}`, {
        path: `${NftRarityService.name}.${this.updateCollectionRarities.name}`,
        error: error.message,
      });
      return false;
    }
  }

  async updateAllCollectionsRarities(): Promise<void> {
    await Locker.lock(
      'updateAllCollectionTraits: Update rarities for all existing collections',
      async () => {
        try {
          const collections = await this.nftRarityElasticService.getAllCollectionsWithRarityFlagsFromElastic();

          this.logger.log(`Total collections to be updated - ${collections.length}`);

          for (const collectionFromElastic of collections) {
            await this.updateCollectionRarities(collectionFromElastic.ticker, collectionFromElastic.hasRarities);
          }
        } catch (error) {
          this.logger.error('Error when updating all collection rarities', {
            path: `${NftRarityService.name}.${this.updateCollectionRarities.name}`,
            exception: error?.message,
          });
        }
      },
      true,
    );
  }

  async validateAllCollectionsRarities(): Promise<void> {
    await Locker.lock(
      'validateAllCollectionsRarities: Validate rarities for all existing collections',
      async () => {
        try {
          const collections = await this.nftRarityElasticService.getAllCollectionsFromElastic();

          this.logger.log(`Total collections to be validated - ${collections.length}`);

          for (const collection of collections) {
            await this.validateRarities(collection);
          }
        } catch (error) {
          this.logger.error('Error when updating all collection rarities', {
            path: `${NftRarityService.name}.${this.validateAllCollectionsRarities.name}`,
            exception: error?.message,
          });
        }
      },
      true,
    );
  }

  async deleteNftRarity(identifier: string): Promise<any> {
    return await this.persistenceService.deleteNftRarity(identifier);
  }

  private async computeRarities(nfts: NftRarityData[], collectionTicker: string, collectionSize: number) {
    let rarities: NftRarityEntity[] = [];
    try {
      rarities = await this.nftRarityComputeService.computeRarities(collectionTicker, collectionSize, this.sortDescNftsByNonce(nfts));
    } catch (error) {
      this.logger.error(`Error when computing rarities`, {
        path: 'NftRarityService.updateRarities',
        exception: error?.message,
        collection: collectionTicker,
      });
    }
    return rarities;
  }

  private async migrateRaritiesFromDbToElastic(collectionTicker: string, dbNfts: NftRarityEntity[]): Promise<void> {
    this.logger.log(`${collectionTicker} - Elastic rarities missing => migration from DB`);
    await Promise.all([
      this.nftRarityElasticService.setCollectionRarityFlagInElastic(collectionTicker, true),
      this.nftRarityElasticService.setNftRaritiesInElastic(NftRarityData.fromDbNfts(dbNfts)),
    ]);
  }

  private areIdenticalRarities(elasticNfts: NftRarityData[], dbNfts: NftRarityEntity[]): boolean {
    const nftsWithAttributesCount = elasticNfts.filter((nft) => nft.hasRarity).length;
    const unprocessedNftsCount = elasticNfts.filter((nft) => nft.hasRarity === undefined).length;

    if (nftsWithAttributesCount === dbNfts.length && unprocessedNftsCount === 0) {
      return true;
    }

    if (elasticNfts.length !== dbNfts.length) {
      return false;
    }

    for (let i = 0; i < elasticNfts.length; i++) {
      const elasticNft = elasticNfts[i];
      const dbNft = dbNfts[i];
      if (!NftRarityData.areIdenticalRarities(elasticNft, dbNft)) {
        return false;
      }
    }

    return true;
  }

  private areRaritiesMissingFromElasticOnly(elasticNfts: NftRarityData[], dbNfts: NftRarityEntity[]): boolean {
    if (elasticNfts.filter((nft) => nft.rarities.openRarityScore).length === 0 && dbNfts.filter((nft) => nft.score_openRarity).length > 0) {
      return true;
    }
    false;
  }

  private async getAllCollectionNftsWithCustomRanksFromAPI(
    collectionTicker: string,
    collectionNftsCount: number,
  ): Promise<[NftRarityData[], CustomRank[]]> {
    try {
      let traitTypeIndexes: number[] = [];
      let attributeIndexes: number[][] = [];
      let allNfts: NftRarityData[] = [];
      let nfts: NftRarityData[];

      await this.mxApiService.getScrollableNftsByCollectionAfterNonceDesc(
        collectionTicker,
        'identifier,nonce,metadata,score,rank,rarities,timestamp',
        async (nftsBatch) => {
          [nfts, traitTypeIndexes, attributeIndexes] = NftRarityData.fromNfts(nftsBatch, traitTypeIndexes, attributeIndexes);
          allNfts = allNfts.concat(nfts);
          nfts = undefined;
        },
        collectionNftsCount,
      );
      if (allNfts.length === 0) {
        return [[], []];
      }
      allNfts = this.sortDescNftsByNonce(allNfts);

      const preferredAlgorithm = await this.mxApiService.getCollectionPreferredAlgorithm(collectionTicker);
      if (preferredAlgorithm === 'custom') {
        const customRanks = await this.mxApiService.getCollectionCustomRanks(collectionTicker);
        return [NftRarityData.setCustomRanks(allNfts, customRanks), customRanks];
      }
      return [allNfts, []];
    } catch (error) {
      this.logger.error(`Error when getting all collection NFTs from API`, {
        path: `${NftRarityService.name}.${this.getAllCollectionNftsWithCustomRanksFromAPI.name}`,
        exception: error?.message,
        collection: collectionTicker,
      });
      return [[], []];
    }
  }

  private filterNftsWithAttributes(nfts: NftRarityData[]): NftRarityData[] {
    return nfts.filter((nft) => nft.DNA?.length > 0);
  }

  private filterNftsWithoutAttributes(nfts: NftRarityData[]): NftRarityData[] {
    return nfts.filter((nft) => !nft.DNA || nft.DNA.length === 0);
  }

  private sortDescNftsByNonce(nfts: NftRarityData[]): NftRarityData[] {
    return [...nfts].sort(function (a, b) {
      return b.nonce - a.nonce;
    });
  }

  private async isCollectionTooBig(collection: string, nftsCount?: number): Promise<[boolean, number]> {
    if (!nftsCount) {
      nftsCount = await this.mxApiService.getCollectionNftsCount(collection);
    }
    if (nftsCount > constants.nftsCountThresholdForTraitAndRarityIndexing) {
      this.logger.log(
        `${collection} - Collection NFTs count bigger than threshold ${nftsCount} > ${constants.nftsCountThresholdForTraitAndRarityIndexing}`,
      );
      return [true, nftsCount];
    }
    return [false, nftsCount];
  }
}
