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
              await this.validateTokenRarities(items.map((i) => i.token));
            },
          );
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
          collection,
          async () => {
            await this.nftRarityService.validateRarities(collection);
          },
          true,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(`Error when validating collection rarities`, {
          path: 'RarityUpdaterService.handleValidateTokenRarity',
          exception: error?.message,
          collection: collection,
        });
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }

  async handleSetTokenRarities() {
    try {
      await Locker.lock(
        'handleSetTokenRarities: Update tokens rarity',
        async () => {
          let updatedCollections: string[] = [];

          const query = ElasticQuery.create()
            .withMustNotExistCondition('nft_hasRarity')
            .withMustNotExistCondition('nft_hasRarities')
            .withMustExistCondition('token')
            .withMustMultiShouldCondition(
              [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
              (type) => QueryType.Match('type', type),
            )
            .withPagination({ from: 0, size: 5 });

          await this.elasticService.getScrollableList(
            'tokens',
            'token',
            query,
            async (items) => {
              const collections = [...new Set(items.map((i) => i.token))];
              const collectionsToUpdate = collections.filter(
                (c) => updatedCollections.indexOf(c) === -1,
              );

              const notUpdatedCollections = await this.updateTokenRarities(
                collectionsToUpdate,
              );

              const successfullyUpdatedCollections = collectionsToUpdate.filter(
                (c) => notUpdatedCollections.indexOf(c) === -1,
              );

              updatedCollections = updatedCollections.concat(
                successfullyUpdatedCollections,
              );
            },
          );
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
          collection,
          async () => {
            await this.nftRarityService.updateRarities(collection);
          },
          true,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(`Error when updating collection raritiies`, {
          path: 'ElasticRarityUpdaterService.handleValidateTokenRarity',
          exception: error?.message,
          collection: collection,
        });
        notUpdatedCollections.push(collection);
        await new Promise((resolve) => setTimeout(resolve, 10000));
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
}
