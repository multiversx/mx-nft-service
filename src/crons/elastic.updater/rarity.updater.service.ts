import { Injectable, Logger } from '@nestjs/common';
import { MxElasticService, RedisCacheService } from 'src/common';
import { Locker } from 'src/utils/locker';
import { NftRarityService } from 'src/modules/nft-rarity/nft-rarity.service';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TimeConstants } from 'src/utils/time-utils';
import { NftRarityElasticService } from 'src/modules/nft-rarity/nft-rarity.elastic.service';

@Injectable()
export class RarityUpdaterService {
  private readonly rarityQueueRedisClient: Redis.Redis;
  private readonly persistentRedisClient: Redis.Redis;

  constructor(
    private readonly elasticService: MxElasticService,
    private readonly nftRarityService: NftRarityService,
    private readonly nftRarityElasticService: NftRarityElasticService,
    private readonly redisCacheService: RedisCacheService,
    private readonly logger: Logger,
  ) {
    this.rarityQueueRedisClient = this.redisCacheService.getClient(
      cacheConfig.rarityQueueClientName,
    );
    this.persistentRedisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async handleReindexAllTokenRarities(): Promise<void> {
    await this.nftRarityService.updateAllCollectionsRarities();
  }

  async handleValidateAllTokenRarities(): Promise<void> {
    await this.nftRarityService.validateAllCollectionsRarities();
  }

  async handleUpdateTokenRaritiesWhereNotSet(maxCollectionsToUpdate: number) {
    try {
      await Locker.lock(
        'handleUpdateTokenRaritiesWhereNotSet',
        async () => {
          let collectionsToUpdate: string[] = [];

          const query =
            this.nftRarityElasticService.getAllNftsWhereRarityNotComputedFromElasticQuery();

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
            await this.nftRarityService.updateCollectionRarities(collection);
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

  private getRarityValidatorCounterCacheKey() {
    return generateCacheKeyFromParams('rarityValidatorCounter');
  }
}
