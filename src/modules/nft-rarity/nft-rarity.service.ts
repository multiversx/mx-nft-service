import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { NftRarityComputeService } from './nft-rarity.compute.service';
import { NftRarityEntity } from '../../db/nft-rarity/nft-rarity.entity';
import { AssetRarityInfoRedisHandler } from '../assets/loaders/assets-rarity-info.redis-handler';
import { ElrondPrivateApiService } from 'src/common/services/elrond-communication/elrond-private-api.service';
import { NftRarityData } from './models/nft-rarity-data.model';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { Locker } from 'src/utils/locker';
import { CustomRank } from './models/custom-rank.model';
import { NftRarityElasticService } from './nft-rarity.elastic.service';

@Injectable()
export class NftRarityService {
  constructor(
    private readonly elrondApiService: ElrondApiService,
    private readonly privateApiService: ElrondPrivateApiService,
    private readonly nftRarityElasticService: NftRarityElasticService,
    private readonly persistenceService: PersistenceService,
    private readonly nftRarityComputeService: NftRarityComputeService,
    private readonly assetRarityRedisHandler: AssetRarityInfoRedisHandler,
    private readonly logger: Logger,
  ) {
    this.nftRarityElasticService.setElasticRarityMappings();
  }

  async validateRarities(collectionTicker: string): Promise<boolean> {
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

    return valid;
  }

  async updateCollectionRarities(
    collectionTicker: string,
    skipIfRaritiesFlag = false,
  ): Promise<boolean> {
    const [allNfts, raritiesFlag] = await Promise.all([
      this.getAllCollectionNftsWithCustomRanksFromAPI(collectionTicker),
      this.nftRarityElasticService.getCollectionRarityFlag(collectionTicker),
    ]);

    if (raritiesFlag === undefined) {
      this.logger.warn(`Wrong collection ID`, {
        path: 'NftRarityService.updateRarities',
        collection: collectionTicker,
      });
      return false;
    }

    if (!raritiesFlag && skipIfRaritiesFlag) {
      this.logger.log(
        `${collectionTicker} - Update rarities process skipped because rarities flag === true & skipIfRaritiesFlag === true`,
        {
          path: `${NftRarityService.name}.${this.updateCollectionRarities.name}`,
          collection: collectionTicker,
        },
      );
      return false;
    }

    if (allNfts?.length === 0) {
      const nftsFromElastic =
        await this.nftRarityElasticService.getAllCollectionNftsFromElastic(
          collectionTicker,
        );

      const reason: string =
        nftsFromElastic.length === 0
          ? 'No NFTs'
          : 'Not valid NFT (bad metadata storage or/and URIs)';
      this.logger.log(
        `${collectionTicker} - ${reason} -> set nft_hasRaries & nft_hasRarity flags to false & return false`,
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
        this.nftRarityElasticService.setNftRaritiesInElastic(
          nftsFromElastic,
          false,
        ),
      ]);
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

    const nftsWithoutAttributes = this.filterNftsWithoutAttributes(allNfts);

    if (nftsWithoutAttributes.length > 0) {
      nftsWithAttributes = nftsWithAttributes.concat(
        await this.reprocessNftsMetadataAndSetFlags(
          collectionTicker,
          nftsWithoutAttributes,
          nftsWithAttributes.length,
        ),
      );
    }

    const rarities: NftRarityEntity[] = await this.computeRarities(
      nftsWithAttributes,
      collectionTicker,
    );

    if (!rarities) {
      this.logger.error(`No rarities were computed`, {
        path: 'NftRarityService.updateRarities',
        collection: collectionTicker,
      });
      return false;
    }

    try {
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
    } catch (error) {
      this.logger.error(`Error when updating DB, Elastic or clearing cache`, {
        path: 'NftRarityService.updateRarities',
        exception: error?.message,
        collection: collectionTicker,
      });
      return false;
    }

    return true;
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
        this.sortAscNftsByNonce(nfts),
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
      let [nftsRaw, preferredAlgorithm] = await Promise.all([
        this.elrondApiService.getAllNftsByCollectionAfterNonce(
          collectionTicker,
          'identifier,nonce,metadata,score,rank,rarities,timestamp',
        ),
        this.elrondApiService.getCollectionPreferredAlgorithm(collectionTicker),
      ]);
      let customRanksPromise: Promise<CustomRank[] | undefined>;
      if (preferredAlgorithm === 'custom') {
        customRanksPromise =
          this.elrondApiService.getCollectionCustomRanks(collectionTicker);
      }
      let nfts = NftRarityData.fromNfts(nftsRaw);
      if (customRanksPromise) {
        return NftRarityData.setCustomRanks(nfts, await customRanksPromise);
      }
      return nfts;
    } catch (error) {
      this.logger.error(`Error when getting all collection NFTs from API`, {
        path: 'NftRarityService.getAllCollectionNftsFromAPI',
        exception: error?.message,
        collection: collectionTicker,
      });
      return [];
    }
  }

  private async reprocessNftsMetadataAndSetFlags(
    collectionTicker: string,
    nftsWithoutAttributes: NftRarityData[],
    nftsWithAttributesCount: number = null,
  ): Promise<NftRarityData[]> {
    let successfullyProcessedNFTs: NftRarityData[] = [];

    try {
      let customInfo = {
        path: `${NftRarityService.name}.${this.reprocessNftsMetadataAndSetFlags.name}`,
        collection: collectionTicker,
        nftsFound: nftsWithAttributesCount,
        successfullyIndexed: 0,
        unsuccessfullyIndexed: 0,
      };

      for (const nft of nftsWithoutAttributes) {
        await this.privateApiService.processNft(nft.identifier);
        const processedNft = await this.elrondApiService.getNftByIdentifier(
          nft.identifier,
        );
        if (processedNft?.metadata?.attributes !== undefined) {
          successfullyProcessedNFTs.push(NftRarityData.fromNft(processedNft));
        }
      }

      customInfo.successfullyIndexed = successfullyProcessedNFTs.length;

      const unsuccessfullyProcessedNfts = nftsWithoutAttributes.filter(
        (nft) => successfullyProcessedNFTs.indexOf(nft) === -1,
      );

      if (unsuccessfullyProcessedNfts.length > 0) {
        customInfo.unsuccessfullyIndexed = unsuccessfullyProcessedNfts.length;
        await this.nftRarityElasticService.setNftRaritiesInElastic(
          unsuccessfullyProcessedNfts,
          false,
        );
      }

      this.logger.log(
        `${collectionTicker} - Tried to reprocess NFT attributes`,
        customInfo,
      );
    } catch (error) {
      this.logger.error(`Error when trying to reprocess collection metadata`, {
        path: 'NftRarityService.reprocessNftsMetadataAndSetFlags',
        exception: error?.message,
        collection: collectionTicker,
      });
    }

    return successfullyProcessedNFTs;
  }

  private filterNftsWithAttributes(nfts: NftRarityData[]): NftRarityData[] {
    return nfts.filter((nft) => nft.DNA?.length > 0);
  }

  private filterNftsWithoutAttributes(nfts: NftRarityData[]): NftRarityData[] {
    return nfts.filter(
      (nft) => nft.metadata === undefined || nft.DNA?.length === 0,
    );
  }

  private sortAscNftsByNonce(nfts: NftRarityData[]): NftRarityData[] {
    return [...nfts].sort(function (a, b) {
      return b.nonce - a.nonce;
    });
  }
}
