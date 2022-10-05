import { Injectable, Logger } from '@nestjs/common';
import { ElrondElasticService, RedisCacheService } from 'src/common';
import { Locker } from 'src/utils/locker';
import { ElasticQuery, QueryOperator, QueryType } from '@elrondnetwork/erdnest';
import { NftRarityService } from 'src/modules/nft-rarity/nft-rarity.service';
import { NftTypeEnum } from 'src/modules/assets/models';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TimeConstants } from 'src/utils/time-utils';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable()
export class RarityUpdaterService {
  private readonly rarityQueueRedisClient: Redis.Redis;
  private readonly persistentRedisClient: Redis.Redis;

  constructor(
    private readonly elasticService: ElrondElasticService,
    private readonly nftRarityService: NftRarityService,
    private readonly redisCacheService: RedisCacheService,
    private readonly persistenceService: PersistenceService,
    private readonly logger: Logger,
  ) {
    this.rarityQueueRedisClient = this.redisCacheService.getClient(
      cacheConfig.rarityQueueClientName,
    );
    this.persistentRedisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async handleReindexTokenRarities() {
    try {
      await Locker.lock(
        `handleReindexTokenRarities`,
        async () => {
          const collections = await this.persistenceService.getCollectionIds();
          for (const collection of collections) {
            await this.nftRarityService.validateRarities(collection);
          }
        },
        true,
      );
    } catch (error) {
      this.logger.error(`Error when reindexing collection rarities`, {
        path: 'RarityUpdaterService.handleReindexTokenRarities',
        exception: error?.message,
      });
    }
  }

  async handleValidateTokenRarities(maxCollectionsToValidate: number) {
    let lastIndex: number;
    try {
      await Locker.lock(
        'handleValidateTokenRarities',
        async () => {
          lastIndex = await this.getLastValidatedCollectionIndex();
          let collections: string[] = [];

          const query: ElasticQuery = ElasticQuery.create()
            .withMustNotExistCondition('nonce')
            .withMustExistCondition('nft_hasRarities')
            .withMustCondition(
              QueryType.Match('nft_hasRarities', true, QueryOperator.AND),
            )
            .withMustMultiShouldCondition(
              [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
              (type) => QueryType.Match('type', type),
            )
            .withPagination({
              from: 0,
              size: 50,
            });

          await this.elasticService.getScrollableList(
            'tokens',
            'token',
            query,
            async (items) => {
              collections = collections.concat(items.map((i) => i.token));
            },
            lastIndex + maxCollectionsToValidate,
          );

          const collectionsToValidate = collections.slice(
            lastIndex,
            lastIndex + maxCollectionsToValidate,
          );

          if (collectionsToValidate.length !== 0) {
            await this.validateTokenRarities(collectionsToValidate);
            await this.setLastValidatedCollectionIndex(
              lastIndex + collectionsToValidate.length,
            );
          } else {
            await this.setLastValidatedCollectionIndex(0);
          }
        },
        true,
      );
    } catch (error) {
      this.logger.error(`Error when scrolling through collections`, {
        path: 'RarityUpdaterService.handleValidateTokenRarity',
        exception: error?.message,
        lastIndex: lastIndex,
      });
    }
  }

  async validateTokenRarities(collections: string[]): Promise<void> {
    for (const collection of collections) {
      try {
        await Locker.lock(
          `Update/Validate rarities for ${collection}`,
          async () => {
            await this.nftRarityService.validateRarities(collection);
          },
          true,
        );
      } catch (error) {
        this.logger.error(`Error when validating collection rarities`, {
          path: 'RarityUpdaterService.handleValidateTokenRarity',
          exception: error?.message,
          collection: collection,
        });
      }
    }
  }

  async handleValidateTokenRarityFlags(maxCollectionsToValidate: number) {
    let lastIndex: number;
    try {
      await Locker.lock(
        'handleValidateTokenRarityFlags',
        async () => {
          lastIndex = await this.getLastFlagValidatedCollectionIndex();
          let collections: string[] = [];

          const query: ElasticQuery = ElasticQuery.create()
            .withMustNotExistCondition('nonce')
            .withMustExistCondition('nft_hasRarities')
            .withMustCondition(
              QueryType.Match('nft_hasRarities', false, QueryOperator.AND),
            )
            .withMustMultiShouldCondition(
              [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
              (type) => QueryType.Match('type', type),
            )
            .withPagination({
              from: 0,
              size: 50,
            });

          await this.elasticService.getScrollableList(
            'tokens',
            'token',
            query,
            async (items) => {
              collections = collections.concat(items.map((i) => i.token));
            },
            lastIndex + maxCollectionsToValidate,
          );

          const collectionsToValidate = collections.slice(
            lastIndex,
            lastIndex + maxCollectionsToValidate,
          );

          if (collectionsToValidate.length !== 0) {
            await this.validateTokenRarityFlags(collectionsToValidate);
            await this.setLastFlagValidatedCollectionIndex(
              lastIndex + collectionsToValidate.length,
            );
          } else {
            await this.setLastFlagValidatedCollectionIndex(0);
          }
        },
        true,
      );
    } catch (error) {
      this.logger.error(`Error when scrolling through collections`, {
        path: 'RarityUpdaterService.handleValidateTokenRarityFlags',
        exception: error?.message,
        lastIndex: lastIndex,
      });
    }
  }

  async validateTokenRarityFlags(collections: string[]): Promise<void> {
    for (const collection of collections) {
      try {
        await Locker.lock(
          `Validate rarity flag for ${collection}`,
          async () => {
            await this.nftRarityService.updateRarities(collection);
          },
          true,
        );
      } catch (error) {
        this.logger.error(`Error when validating collection rarity flags`, {
          path: 'RarityUpdaterService.validateTokenRarityFlags',
          exception: error?.message,
          collection: collection,
        });
      }
    }
  }

  async handleUpdateTokenRarities(maxCollectionsToUpdate: number) {
    try {
      await Locker.lock(
        'handleUpdateTokenRarities',
        async () => {
          let collectionsToUpdate: string[] = [];

          const query = ElasticQuery.create()
            .withMustExistCondition('nonce')
            .withMustNotCondition(QueryType.Exists('nft_hasRarity'))
            .withMustCondition(
              QueryType.Nested('data', { 'data.nonEmptyURIs': true }),
            )
            .withMustCondition(
              QueryType.Nested('data', { 'data.whiteListedStorage': true }),
            )
            .withMustMultiShouldCondition(
              [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
              (type) => QueryType.Match('type', type),
            )
            .withPagination({
              from: 0,
              size: 100,
            });

          await this.elasticService.getScrollableList(
            'tokens',
            'token',
            query,
            async (items) => {
              const collections = [...new Set(items.map((i) => i.token))];
              collectionsToUpdate = collectionsToUpdate.concat(
                collections.filter(
                  (c) => collectionsToUpdate.indexOf(c) === -1,
                ),
              );
              if (collectionsToUpdate.length >= maxCollectionsToUpdate) {
                return false;
              }
            },
          );

          collectionsToUpdate = collectionsToUpdate.slice(
            0,
            maxCollectionsToUpdate,
          );

          await this.updateTokenRarities(collectionsToUpdate);
        },
        true,
      );
    } catch (error) {
      this.logger.error(`Error when scrolling through NFTs`, {
        path: 'RarityUpdaterService.handleUpdateTokenRarity',
        exception: error?.message,
      });
    }
  }

  async updateTokenRarities(collections: string[]): Promise<string[]> {
    let notUpdatedCollections: string[] = [];
    for (const collection of collections) {
      try {
        await Locker.lock(
          `Update/Validate rarities for ${collection}`,
          async () => {
            await this.nftRarityService.updateRarities(collection);
          },
          true,
        );
      } catch (error) {
        this.logger.error(`Error when updating collection rarities`, {
          path: 'RarityUpdaterService.handleValidateTokenRarity',
          exception: error?.message,
          collection: collection,
        });
        notUpdatedCollections.push(collection);
      }
    }
    return notUpdatedCollections;
  }

  async processTokenRarityQueue() {
    await Locker.lock(
      'processTokenRarityQueue: Update rarities for all collections in the rarities queue',
      async () => {
        const collectionsToUpdate: string[] =
          await this.redisCacheService.popAllItemsFromList(
            this.rarityQueueRedisClient,
            this.getRarityQueueCacheKey(),
            true,
          );

        const notUpdatedCollections: string[] = await this.updateTokenRarities(
          collectionsToUpdate,
        );

        await this.addCollectionsToRarityQueue(notUpdatedCollections);
      },
      true,
    );
  }

  async addCollectionsToRarityQueue(
    collectionTickers: string[],
  ): Promise<void> {
    if (collectionTickers?.length > 0) {
      await this.redisCacheService.addItemsToList(
        this.rarityQueueRedisClient,
        this.getRarityQueueCacheKey(),
        collectionTickers,
      );
    }
  }

  private getRarityQueueCacheKey() {
    return generateCacheKeyFromParams(cacheConfig.rarityQueueClientName);
  }

  private getRarityValidatorCounterCacheKey() {
    return generateCacheKeyFromParams('rarityValidatorCounter');
  }

  private getRarityFlagValidatorCounterCacheKey() {
    return generateCacheKeyFromParams('rarityFlagValidatorCounter');
  }

  private async getLastValidatedCollectionIndex(): Promise<number> {
    return (
      Number.parseInt(
        await this.persistentRedisClient.get(
          this.getRarityValidatorCounterCacheKey(),
        ),
      ) || 0
    );
  }

  private async setLastValidatedCollectionIndex(index: number): Promise<void> {
    await this.persistentRedisClient.set(
      this.getRarityValidatorCounterCacheKey(),
      index.toString(),
      'EX',
      90 * TimeConstants.oneMinute,
    );
  }

  private async getLastFlagValidatedCollectionIndex(): Promise<number> {
    return (
      Number.parseInt(
        await this.persistentRedisClient.get(
          this.getRarityFlagValidatorCounterCacheKey(),
        ),
      ) || 0
    );
  }

  private async setLastFlagValidatedCollectionIndex(
    index: number,
  ): Promise<void> {
    await this.persistentRedisClient.set(
      this.getRarityFlagValidatorCounterCacheKey(),
      index.toString(),
      'EX',
      90 * TimeConstants.oneMinute,
    );
  }
}
