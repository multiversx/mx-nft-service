import { Injectable, Logger } from '@nestjs/common';
import { ElrondElasticService, RedisCacheService } from 'src/common';
import { Locker } from 'src/utils/locker';
import { ElasticQuery, QueryType } from '@elrondnetwork/erdnest';
import { NftRarityService } from 'src/modules/nft-rarity/nft-rarity.service';
import { NftTypeEnum } from 'src/modules/assets/models';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';

@Injectable()
export class RarityUpdaterService {
  private readonly redisClient: Redis.Redis;

  constructor(
    private readonly elasticService: ElrondElasticService,
    private readonly nftRarityService: NftRarityService,
    private readonly logger: Logger,
    private readonly redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.rarityQueueClientName,
    );
  }

  async handleValidateToken() {
    try {
      await Locker.lock(
        'handleValidateToken: Validate tokens rarity',
        async () => {
          let collectionsToValidate: string[] = [];

          const query = ElasticQuery.create()
            .withMustNotExistCondition('nonce')
            .withMustMultiShouldCondition(
              [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
              (type) => QueryType.Match('type', type),
            )
            .withPagination({ from: 0, size: 10000 });

          await this.elasticService.getScrollableList(
            'tokens',
            'token',
            query,
            async (items) => {
              const collections = [...new Set(items.map((i) => i.token))];
              collectionsToValidate = collectionsToValidate.concat(
                collections.filter(
                  (c) => collectionsToValidate.indexOf(c) === -1,
                ),
              );
            },
          );

          await this.validateTokenRarities(collectionsToValidate);
        },
        true,
      );
    } catch (error) {
      this.logger.error(`Error when scrolling through collections`, {
        path: 'RarityUpdaterService.handleValidateTokenRarity',
        exception: error?.message,
      });
    }
  }

  async validateTokenRarities(collections: string[]): Promise<void> {
    for (const collection of collections) {
      try {
        this.logger.log(
          `handleValidateTokenRarity(): validateRarities(${collection})`,
        );
        await Locker.lock(
          `Update/Validate rarities for ${collection}`,
          async () => {
            await this.nftRarityService.validateRarities(collection);
          },
          true,
        );
        this.forceClearGC();
      } catch (error) {
        this.logger.error(`Error when validating collection rarities`, {
          path: 'RarityUpdaterService.handleValidateTokenRarity',
          exception: error?.message,
          collection: collection,
        });
      }
    }
  }

  async handleUpdateTokenRarities(maxCollectionsToUpdate: number = null) {
    try {
      await Locker.lock(
        'handleUpdateTokenRarities: Update tokens rarity',
        async () => {
          let collectionsToUpdate: string[] = [];
          let stop = false;

          const query = ElasticQuery.create()
            .withMustNotExistCondition('nft_hasRarity')
            .withMustNotExistCondition('nft_hasRarities')
            .withMustExistCondition('token')
            .withMustMultiShouldCondition(
              [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
              (type) => QueryType.Match('type', type),
            )
            .withPagination({ from: 0, size: 10000 });

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
                stop = true;
              }
            },
            stop,
          );

          if (maxCollectionsToUpdate) {
            collectionsToUpdate = collectionsToUpdate.slice(
              0,
              maxCollectionsToUpdate,
            );
          }

          await this.updateTokenRarities(collectionsToUpdate);
        },
        true,
      );
    } catch (error) {
      this.logger.error(`Error when scrolling through NFTs`, {
        path: 'ElasticRarityUpdaterService.handleUpdateTokenRarity',
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
        this.forceClearGC();
      } catch (error) {
        this.logger.error(`Error when updating collection raritiies`, {
          path: 'ElasticRarityUpdaterService.handleValidateTokenRarity',
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
            this.redisClient,
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
        this.redisClient,
        this.getRarityQueueCacheKey(),
        collectionTickers,
      );
    }
  }

  private getRarityQueueCacheKey() {
    return generateCacheKeyFromParams(cacheConfig.rarityQueueClientName);
  }

  private forceClearGC() {
    if (global.gc) {
      global.gc();
    }
  }
}
