import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService, ElrondElasticService } from 'src/common';
import { NftRarityComputeService } from './nft-rarity.compute.service';
import { NftRarityEntity } from '../../db/nft-rarity/nft-rarity.entity';
import {
  ElasticQuery,
  ElasticSortOrder,
  QueryOperator,
  QueryType,
} from '@elrondnetwork/erdnest';
import { NftTypeEnum } from '../assets/models';
import { AssetRarityInfoRedisHandler } from '../assets/loaders/assets-rarity-info.redis-handler';
import { ElrondPrivateApiService } from 'src/common/services/elrond-communication/elrond-private-api.service';
import { NftRarityData } from './models/nft-rarity-data.model';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { constants } from 'src/config';
import { Locker } from 'src/utils/locker';

@Injectable()
export class NftRarityService {
  constructor(
    private readonly apiService: ElrondApiService,
    private readonly privateApiService: ElrondPrivateApiService,
    private readonly elasticService: ElrondElasticService,
    private readonly persistenceService: PersistenceService,
    private readonly nftRarityComputeService: NftRarityComputeService,
    private readonly assetRarityRedisHandler: AssetRarityInfoRedisHandler,
    private readonly logger: Logger,
  ) {
    this.setElasticRarityMappings();
  }

  async validateRarities(collectionTicker: string): Promise<boolean> {
    const [elasticNfts, dbNfts] = await Promise.all([
      this.getAllCollectionNftsFromElastic(collectionTicker),
      this.persistenceService.findNftRarityByCollection(collectionTicker),
    ]);

    const areIdenticalRarities = this.areIdenticalRarities(elasticNfts, dbNfts);

    if (!areIdenticalRarities) {
      const areRaritiesMissingFromElasticOnly =
        this.areRaritiesMissingFromElasticOnly(elasticNfts, dbNfts);
      if (areRaritiesMissingFromElasticOnly) {
        await this.migrateRaritiesFromDbToElastic(collectionTicker, dbNfts);
        return false;
      } else {
        this.logger.log(
          `Rarities missmatch/missing for ${collectionTicker} => recalculate`,
          {
            collection: collectionTicker,
          },
        );
        await this.updateRarities(collectionTicker);
        return false;
      }
    }

    return true;
  }

  async updateRarities(
    collectionTicker: string,
    skipIfRaritiesFlag = false,
  ): Promise<boolean> {
    const [allNfts, raritiesFlag] = await Promise.all([
      this.getAllCollectionNftsFromAPI(collectionTicker),
      this.getCollectionRarityFlag(collectionTicker),
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
        `Update rarities process skipped because rarities flag === true & skipIfRaritiesFlag === true`,
        {
          path: 'NftRarityService.updateRarities',
          collection: collectionTicker,
        },
      );
      return false;
    }

    if (allNfts?.length === 0) {
      const nftsFromElastic = await this.getAllCollectionNftsFromElastic(
        collectionTicker,
      );

      const reason: string =
        nftsFromElastic.length === 0
          ? 'No NFTs'
          : 'Not valid NFT (bad metadata storage or/and URIs)';
      this.logger.log(
        `${reason} -> set nft_hasRaries & nft_hasRarity flags to false & return false`,
        {
          path: 'NftRarityService.updateRarities',
          collection: collectionTicker,
        },
      );

      await Promise.all([
        this.setCollectionRarityFlagInElastic(collectionTicker, false),
        this.setNftRaritiesInElastic(nftsFromElastic, false),
      ]);
      return false;
    }

    let nftsWithAttributes = this.filterNftsWithAttributes(allNfts);

    if (nftsWithAttributes?.length === 0) {
      this.logger.log(
        'Collection has no attributes or attributes were not indexed yet by the elrond api',
        {
          path: 'NftRarityService.updateRarities',
          collection: collectionTicker,
        },
      );
      await Promise.all([
        this.setCollectionRarityFlagInElastic(collectionTicker, false),
        this.setNftRaritiesInElastic(allNfts, false),
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
        this.setCollectionRarityFlagInElastic(collectionTicker, true),
        this.setNftRaritiesInElastic(rarities),
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
    this.logger.log(`Elastic rarities missing => migration from DB`, {
      collection: collectionTicker,
    });
    await Promise.all([
      this.setCollectionRarityFlagInElastic(collectionTicker, true),
      this.setNftRaritiesInElastic(dbNfts),
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
      elasticNfts.filter((nft) => nft.score_openRarity).length === 0 &&
      dbNfts.filter((nft) => nft.score_openRarity).length > 0
    ) {
      return true;
    }
    false;
  }

  private buildNftRaritiesBulkUpdate(
    nfts: NftRarityEntity[] | NftRarityData[],
    hasRarities: boolean = true,
  ): string[] {
    let updates: string[] = [];
    nfts.forEach((r) => {
      if (hasRarities) {
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            'tokens',
            r.identifier,
            'nft_score_openRarity',
            r.score_openRarity,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            'tokens',
            r.identifier,
            'nft_rank_openRarity',
            r.rank_openRarity,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            'tokens',
            r.identifier,
            'nft_score_jaccardDistances',
            r.score_jaccardDistances,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            'tokens',
            r.identifier,
            'nft_rank_jaccardDistances',
            r.rank_jaccardDistances,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            'tokens',
            r.identifier,
            'nft_score_trait',
            r.score_trait,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            'tokens',
            r.identifier,
            'nft_rank_trait',
            r.rank_trait,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            'tokens',
            r.identifier,
            'nft_score_statistical',
            r.score_statistical,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            'tokens',
            r.identifier,
            'nft_rank_statistical',
            r.rank_statistical,
          ),
        );
      }
      updates.push(
        this.elasticService.buildBulkUpdate<boolean>(
          'tokens',
          r.identifier,
          'nft_hasRarity',
          hasRarities,
        ),
      );
    });
    return updates;
  }

  private async setCollectionRarityFlagInElastic(
    collection: string,
    hasRarities: boolean,
  ): Promise<void> {
    try {
      const updateBody = this.elasticService.buildUpdateBody<boolean>(
        'nft_hasRarities',
        hasRarities,
      );
      await this.elasticService.setCustomValue(
        'tokens',
        collection,
        updateBody,
        '?retry_on_conflict=2&timeout=1m',
      );
    } catch (error) {
      this.logger.error('Error when setting collection rarity flag', {
        path: 'NftRarityService.updateRarities',
        exception: error?.message,
        collection: collection,
      });
    }
  }

  private async setNftRaritiesInElastic(
    nfts: NftRarityEntity[] | NftRarityData[],
    hasRarities: boolean = true,
  ): Promise<void> {
    if (nfts.length > 0) {
      try {
        await this.elasticService.bulkRequest(
          'tokens',
          this.buildNftRaritiesBulkUpdate(nfts, hasRarities),
          '?timeout=1m',
        );
      } catch (error) {
        this.logger.error('Error when bulk updating Elastic', {
          path: 'NftRarityService.setNftRaritiesInElastic',
          exception: error?.message,
        });
      }
    }
  }

  private async getCollectionRarityFlag(
    collectionTicker: string,
  ): Promise<boolean> {
    let hasRarities: boolean;

    try {
      const query = ElasticQuery.create()
        .withMustNotExistCondition('nonce')
        .withMustExistCondition('token')
        .withMustMultiShouldCondition(
          [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
          (type) => QueryType.Match('type', type),
        )
        .withMustCondition(
          QueryType.Match('token', collectionTicker, QueryOperator.AND),
        );

      await this.elasticService.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (items) => {
          hasRarities =
            items.length === 1 ? items[0].nft_hasRarities || false : undefined;
          return undefined;
        },
      );
    } catch (error) {
      this.logger.error(`Error when getting collection rarity flag`, {
        path: 'NftRarityService.getCollectionRarityFlag',
        exception: error?.message,
        collection: collectionTicker,
      });
      return false;
    }

    return hasRarities;
  }

  private async getAllCollectionNftsFromAPI(
    collectionTicker: string,
  ): Promise<NftRarityData[]> {
    try {
      const nfts = await this.apiService.getAllNftsByCollectionAfterNonce(
        collectionTicker,
        'identifier,nonce,metadata,score,rank,timestamp',
      );
      return NftRarityData.fromNfts(nfts);
    } catch (error) {
      this.logger.error(`Error when getting all collection NFTs from API`, {
        path: 'NftRarityService.getAllCollectionNftsFromAPI',
        exception: error?.message,
        collection: collectionTicker,
      });
      return [];
    }
  }

  private async getAllCollectionNftsFromElastic(
    collectionTicker: string,
  ): Promise<NftRarityData[]> {
    let nfts: NftRarityData[] = [];

    try {
      const query = ElasticQuery.create()
        .withMustExistCondition('nonce')
        .withMustCondition(
          QueryType.Match('token', collectionTicker, QueryOperator.AND),
        )
        .withMustCondition(
          QueryType.Nested('data', { 'data.nonEmptyURIs': true }),
        )
        .withMustCondition(
          QueryType.Nested('data', { 'data.whiteListedStorage': true }),
        )
        .withFields([
          'nonce',
          'nft_score_openRarity',
          'nft_rank_openRarity',
          'nft_score_jaccardDistances',
          'nft_rank_jaccardDistances',
          'nft_score_trait',
          'nft_rank_trait',
          'nft_score_statistical',
          'nft_rank_statistical',
        ])
        .withSort([{ name: 'nonce', order: ElasticSortOrder.descending }])
        .withPagination({
          from: 0,
          size: constants.getNftsFromElasticBatchSize,
        });

      await this.elasticService.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (newNfts) => {
          nfts = nfts.concat(NftRarityData.fromElasticNfts(newNfts));
          return undefined;
        },
      );
    } catch (error) {
      this.logger.error(`Error when getting all collection NFTs from Elastic`, {
        path: 'NftRarityService.getAllCollectionNftsFromElastic',
        exception: error?.message,
        collection: collectionTicker,
      });
      return [];
    }

    return nfts;
  }

  private async reprocessNftsMetadataAndSetFlags(
    collectionTicker: string,
    nftsWithoutAttributes: NftRarityData[],
    nftsWithAttributesCount: number = null,
  ): Promise<NftRarityData[]> {
    let successfullyProcessedNFTs: NftRarityData[] = [];

    try {
      let customInfo = {
        path: 'NftRarityService.reprocessNftsMetadataAndSetFlags',
        collection: collectionTicker,
        nftsFound: nftsWithAttributesCount,
        successfullyIndexed: 0,
        unsuccessfullyIndexed: 0,
      };

      for (const nft of nftsWithoutAttributes) {
        await this.privateApiService.processNft(nft.identifier);
        const processedNft = await this.apiService.getNftByIdentifier(
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
        await this.setNftRaritiesInElastic(unsuccessfullyProcessedNfts, false);
      }

      this.logger.log(`Tried to reprocess NFT attributes`, customInfo);
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

  async setElasticRarityMappings(): Promise<void> {
    await Locker.lock(
      'setElasticRarityMappings',
      async () => {
        try {
          await this.elasticService.putMappings(
            'tokens',
            this.elasticService.buildPutMultipleMappingsBody([
              {
                key: 'nft_score_openRarity',
                value: 'float',
              },
              {
                key: 'nft_rank_openRarity',
                value: 'long',
              },
              {
                key: 'nft_score_jaccardDistances',
                value: 'float',
              },
              {
                key: 'nft_rank_jaccardDistances',
                value: 'long',
              },
              {
                key: 'nft_score_trait',
                value: 'float',
              },
              {
                key: 'nft_rank_trait',
                value: 'long',
              },
              {
                key: 'nft_score_statistical',
                value: 'float',
              },
              {
                key: 'nft_rank_statistical',
                value: 'long',
              },
            ]),
          );
        } catch (error) {
          this.logger.error(
            'Error when trying to map Elastic types for rarity variables',
            {
              path: 'NftRarityService.setElasticRarityMappings',
            },
          );
        }
      },
      false,
    );
  }
}
