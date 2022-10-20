import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { NftRarityComputeService } from './nft-rarity.compute.service';
import { NftRarityEntity } from '../../db/nft-rarity/nft-rarity.entity';
import { AssetRarityInfoRedisHandler } from '../assets/loaders/assets-rarity-info.redis-handler';
import { NftRarityData } from './models/nft-rarity-data.model';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { Locker } from 'src/utils/locker';
import { CustomRank } from './models/custom-rank.model';
import { NftRarityElasticService } from './nft-rarity.elastic.service';
import { constants } from 'src/config';

@Injectable()
export class NftRarityService {
  constructor(
    private readonly elrondApiService: ElrondApiService,
    private readonly nftRarityElasticService: NftRarityElasticService,
    private readonly persistenceService: PersistenceService,
    private readonly nftRarityComputeService: NftRarityComputeService,
    private readonly assetRarityRedisHandler: AssetRarityInfoRedisHandler,
    private readonly logger: Logger,
  ) {
    this.nftRarityElasticService.setElasticRarityMappings();
  }

  async validateRarities(collectionTicker: string): Promise<boolean> {
    this.logger.log(`${collectionTicker} - Validating collection rarities...`);
    let valid = true;

    const [elasticNfts, dbNfts, preferredAlgorithm]: [
      NftRarityData[],
      NftRarityEntity[],
      string,
    ] = await Promise.all([
      this.nftRarityElasticService.getAllCollectionNftsFromElastic(
        collectionTicker,
      ),
      this.persistenceService.findNftRarityByCollection(collectionTicker),
      this.elrondApiService.getCollectionPreferredAlgorithm(collectionTicker),
    ]);

    let customRanksPromise;
    let customRanksElasticHashPromise;
    if (preferredAlgorithm === 'custom') {
      customRanksPromise =
        this.elrondApiService.getCollectionCustomRanks(collectionTicker);
      customRanksElasticHashPromise =
        this.nftRarityElasticService.getCollectionCustomRanksHash(
          collectionTicker,
        );
    }

    const areIdenticalRarities = this.areIdenticalRarities(elasticNfts, dbNfts);

    if (!areIdenticalRarities) {
      const areRaritiesMissingFromElasticOnly =
        this.areRaritiesMissingFromElasticOnly(elasticNfts, dbNfts);
      if (areRaritiesMissingFromElasticOnly) {
        await this.migrateRaritiesFromDbToElastic(collectionTicker, dbNfts);
        valid = false;
      } else {
        this.logger.log(
          `${collectionTicker} - Rarities missmatch/missing for => recalculate`,
          {
            collection: collectionTicker,
          },
        );
        return await this.updateCollectionRarities(collectionTicker);
      }
    }

    if (preferredAlgorithm === 'custom') {
      const [customRanks, customRanksElasticHash]: [CustomRank[], string] =
        await Promise.all([customRanksPromise, customRanksElasticHashPromise]);
      if (
        customRanks &&
        !CustomRank.areIdenticalHashes(customRanks, customRanksElasticHash)
      ) {
        await this.nftRarityElasticService.setNftCustomRanksInElastic(
          collectionTicker,
          customRanks,
        );
        valid = false;
      }
    }

    this.logger.log(
      `${collectionTicker} - ${valid ? 'Valid' : 'Not valid => Updated'}`,
    );

    return valid;
  }

  async updateCollectionRarities(collectionTicker: string): Promise<boolean> {
    this.logger.log(`${collectionTicker} - Updating rarities...`);
    try {
      if (await this.isCollectionTooBig(collectionTicker)) {
        return false;
      }

      const allNfts = await this.getAllCollectionNftsWithCustomRanksFromAPI(
        collectionTicker,
      );

      if (allNfts?.length === 0) {
        this.logger.log(
          `${collectionTicker} - No NFTs => update collection rarity flag`,
          {
            path: `${NftRarityService.name}.${this.updateCollectionRarities.name}`,
            collection: collectionTicker,
          },
        );
        await this.nftRarityElasticService.setCollectionRarityFlagInElastic(
          collectionTicker,
          false,
        );
        return false;
      }

      let nftsWithAttributes = this.filterNftsWithAttributes(allNfts);

      if (nftsWithAttributes?.length === 0) {
        this.logger.log(
          `${collectionTicker} - Collection has no attributes or attributes were not indexed yet by the elrond api`,
          {
            path: `${NftRarityService.name}.${this.updateCollectionRarities.name}`,
            collection: collectionTicker,
          },
        );
        await Promise.all([
          this.nftRarityElasticService.setCollectionRarityFlagInElastic(
            collectionTicker,
            false,
          ),
          this.nftRarityElasticService.setNftRaritiesInElastic(allNfts, false),
        ]);
        return false;
      }

      const rarities: NftRarityEntity[] = await this.computeRarities(
        nftsWithAttributes,
        collectionTicker,
      );

      if (!rarities) {
        this.logger.log(`No rarities were computed`, {
          path: 'NftRarityService.updateRarities',
          collection: collectionTicker,
        });
        await this.nftRarityElasticService.setNftRaritiesInElastic(
          nftsWithAttributes,
          false,
        );
        return false;
      }

      await Promise.all([
        this.persistenceService.saveOrUpdateBulkRarities(rarities),
        this.nftRarityElasticService.setCollectionRarityFlagInElastic(
          collectionTicker,
          true,
        ),
        this.nftRarityElasticService.setNftRaritiesInElastic(rarities),
        this.assetRarityRedisHandler.clearMultipleKeys(
          rarities.map((r) => r.identifier),
        ),
      ]);

      this.logger.log(`${collectionTicker} - Updated rarities`);

      return true;
    } catch (error) {
      this.logger.log(
        `Error when trying to update/validate collection rarities for ${collectionTicker}`,
        {
          path: `${NftRarityService.name}.${this.updateCollectionRarities.name}`,
          error: error.message,
        },
      );
      return false;
    }
  }

  async updateAllCollectionsRarities(): Promise<void> {
    await Locker.lock(
      'updateAllCollectionTraits: Update rarities for all existing collections',
      async () => {
        try {
          const collections =
            await this.nftRarityElasticService.getAllCollectionsFromElastic();

          this.logger.log(
            `Total collections to be updated - ${collections.length}`,
          );

          for (const collection of collections) {
            await this.updateCollectionRarities(collection);
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
          const collections =
            await this.nftRarityElasticService.getAllCollectionsFromElastic();

          this.logger.log(
            `Total collections to be validated - ${collections.length}`,
          );

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

  private async computeRarities(
    nfts: NftRarityData[],
    collectionTicker: string,
  ) {
    let rarities: NftRarityEntity[] = [];
    try {
      rarities = await this.nftRarityComputeService.computeRarities(
        collectionTicker,
        this.sortDescNftsByNonce(nfts),
      );
    } catch (error) {
      this.logger.error(`Error when computing rarities`, {
        path: 'NftRarityService.updateRarities',
        exception: error?.message,
        collection: collectionTicker,
      });
    }
    return rarities;
  }

  private async migrateRaritiesFromDbToElastic(
    collectionTicker: string,
    dbNfts: NftRarityEntity[],
  ): Promise<void> {
    this.logger.log(
      `${collectionTicker} - Elastic rarities missing => migration from DB`,
      {
        path: `${NftRarityService.name}.${this.migrateRaritiesFromDbToElastic.name}`,
        collection: collectionTicker,
      },
    );
    await Promise.all([
      this.nftRarityElasticService.setCollectionRarityFlagInElastic(
        collectionTicker,
        true,
      ),
      this.nftRarityElasticService.setNftRaritiesInElastic(dbNfts),
    ]);
  }

  private areIdenticalRarities(
    elasticNfts: NftRarityData[],
    dbNfts: NftRarityEntity[],
  ): boolean {
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

  private areRaritiesMissingFromElasticOnly(
    elasticNfts: NftRarityData[],
    dbNfts: NftRarityEntity[],
  ): boolean {
    if (
      elasticNfts.filter((nft) => nft.rarities.openRarityScore).length === 0 &&
      dbNfts.filter((nft) => nft.score_openRarity).length > 0
    ) {
      return true;
    }
    false;
  }

  private async getAllCollectionNftsWithCustomRanksFromAPI(
    collectionTicker: string,
  ): Promise<NftRarityData[]> {
    try {
      let traitTypeIndexes: number[] = [];
      let attributeIndexes: number[][] = [];
      let allNfts: NftRarityData[] = [];
      let nfts: NftRarityData[];

      await this.elrondApiService.getScrollableNftsByCollectionAfterNonce(
        collectionTicker,
        'identifier,nonce,metadata,score,rank,rarities,timestamp',
        async (nftsBatch) => {
          [nfts, traitTypeIndexes, attributeIndexes] = NftRarityData.fromNfts(
            nftsBatch,
            traitTypeIndexes,
            attributeIndexes,
          );
          allNfts = allNfts.concat(nfts);
        },
      );
      allNfts = this.sortDescNftsByNonce(allNfts);

      const preferredAlgorithm =
        await this.elrondApiService.getCollectionPreferredAlgorithm(
          collectionTicker,
        );
      if (preferredAlgorithm === 'custom') {
        const customRanks =
          await this.elrondApiService.getCollectionCustomRanks(
            collectionTicker,
          );
        return NftRarityData.setCustomRanks(allNfts, customRanks);
      }

      return allNfts;
    } catch (error) {
      this.logger.error(`Error when getting all collection NFTs from API`, {
        path: 'NftRarityService.getAllCollectionNftsFromAPI',
        exception: error?.message,
        collection: collectionTicker,
      });
      return [];
    }
  }

  private filterNftsWithAttributes(nfts: NftRarityData[]): NftRarityData[] {
    return nfts.filter((nft) => nft.DNA?.length > 0);
  }

  private sortDescNftsByNonce(nfts: NftRarityData[]): NftRarityData[] {
    return [...nfts].sort(function (a, b) {
      return b.nonce - a.nonce;
    });
  }

  private async isCollectionTooBig(
    collection: string,
    nftsCount?: number,
  ): Promise<boolean> {
    if (!nftsCount) {
      nftsCount = await this.elrondApiService.getCollectionNftsCount(
        collection,
      );
    }
    if (nftsCount > constants.nftsCountThresholdForTraitAndRarityIndexing) {
      this.logger.log(
        `${collection} - Collection NFTs count bigger than threshold`,
        {
          path: `${NftRarityService.name}.${this.isCollectionTooBig.name}`,
          nftsCount: nftsCount,
        },
      );
      return true;
    }
  }
}
