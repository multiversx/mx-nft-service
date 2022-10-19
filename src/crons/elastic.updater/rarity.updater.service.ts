import { Injectable, Logger } from '@nestjs/common';
import { ElrondElasticService, RedisCacheService } from 'src/common';
import { Locker } from 'src/utils/locker';
import { ElasticQuery, QueryType } from '@elrondnetwork/erdnest';
import { NftRarityService } from 'src/modules/nft-rarity/nft-rarity.service';
import { NftTypeEnum } from 'src/modules/assets/models';
import * as Redis from 'ioredis';
import { cacheConfig, constants } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';

@Injectable()
export class RarityUpdaterService {
  private readonly rarityQueueRedisClient: Redis.Redis;

  constructor(
    private readonly elasticService: ElrondElasticService,
    private readonly nftRarityService: NftRarityService,
    private readonly redisCacheService: RedisCacheService,
    private readonly logger: Logger,
  ) {
    this.rarityQueueRedisClient = this.redisCacheService.getClient(
      cacheConfig.rarityQueueClientName,
    );
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
              size: constants.getNftsFromElasticBatchSize,
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
}
