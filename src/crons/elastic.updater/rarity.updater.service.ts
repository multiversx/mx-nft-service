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
    let collections: string[] = [];

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
              collections = collections.concat(items.map((i) => i.token));
            },
          );

          let collection: string = null;
          while ((collection = collections.pop())) {
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

  async handleSetTokenRarities() {
    try {
      await Locker.lock(
        'handleSetTokenRarities: Update tokens rarity',
        async () => {
          let collectionsToUpdate: string[] = [];

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
              collectionsToUpdate = collectionsToUpdate.concat(
                items.map((i) => i.token),
              );
            },
          );

          collectionsToUpdate = [...new Set(collectionsToUpdate)];

          let collection: string = null;
          while ((collection = collectionsToUpdate.pop())) {
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
              await new Promise((resolve) => setTimeout(resolve, 10000));
            }
          }
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

  async processTokenRarityQueue() {
    await Locker.lock(
      'processTokenRarityQueue: Update rarities for all collections in the rarities queue',
      async () => {
        let notUpdatedCollections: string[] = [];
        const collectionsToUpdate: string[] =
          await this.redisCacheService.popAllItemsFromList(
            this.redisClient,
            this.getRarityQueueCacheKey(),
            true,
          );

        let collection: string = null;
        while ((collection = collectionsToUpdate.pop())) {
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
            this.logger.error(`Error when handling rarity queue`, {
              path: 'ElasticRarityUpdaterService.handleUpdateTokenRarityQueue',
              exception: error?.message,
              collection: collection,
            });
            notUpdatedCollections.push(collection);
            await new Promise((resolve) => setTimeout(resolve, 10000));
          }
        }

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
