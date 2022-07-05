import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ElrondElasticService, RedisCacheService } from 'src/common';
import { Locker } from 'src/utils/locker';
import { ElasticQuery, QueryType } from '@elrondnetwork/erdnest';
import { NftRarityService } from 'src/modules/nft-rarity/nft-rarity.service';
import { NftTypeEnum } from 'src/modules/assets/models';
import asyncPool from 'tiny-async-pool';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';

@Injectable()
export class ElasticRarityUpdaterService {
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

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleValidateTokenRarity() {
    let collections: string[] = [];

    try {
      await Locker.lock(
        'Elastic updater: Validate tokens rarity',
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
        },
        true,
      );
    } catch (error) {
      this.logger.error(`Error when scrolling through collections`, {
        path: 'ElasticRarityUpdaterService.handleValidateTokenRarity',
        exception: error?.message,
      });
    }

    await asyncPool(1, collections, async (collection) => {
      try {
        this.logger.log(
          `handleValidateTokenRarity(): validateRarities(${collection})`,
        );
        await this.nftRarityService.validateRarities(collection);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(`Error when validating collection rarities`, {
          path: 'ElasticRarityUpdaterService.handleValidateTokenRarity',
          exception: error?.message,
          collection: collection,
        });
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleUpdateTokenRarity() {
    let collectionsToUpdate: string[] = [];

    try {
      await Locker.lock(
        'Elastic updater: Update tokens rarity',
        async () => {
          const query = ElasticQuery.create()
            .withMustNotExistCondition('nft_hasRarity')
            .withMustNotExistCondition('rarities')
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
        },
        true,
      );
    } catch (error) {
      this.logger.error(`Error when scrolling through NFTs`, {
        path: 'ElasticRarityUpdaterService.handleUpdateTokenRarity',
        exception: error?.message,
      });
    }

    collectionsToUpdate = [...new Set(collectionsToUpdate)];

    await asyncPool(1, collectionsToUpdate, async (collection) => {
      try {
        this.logger.log(
          `handleUpdateTokenRarity(): updateRarities(${collection})`,
        );
        await this.nftRarityService.updateRarities(collection);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(`Error when updating collection raritiies`, {
          path: 'ElasticRarityUpdaterService.handleValidateTokenRarity',
          exception: error?.message,
          collection: collection,
        });
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    });
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleUpdateTokenRarityQueue() {
    let notUpdatedCollections: string[] = [];
    let collectionsToUpdate: string[] =
      await this.popAllCollectionsFromRarityQueue();

    for (const collection of collectionsToUpdate) {
      try {
        this.logger.log(
          `handleUpdateTokenRarityQueue(): updateRarities(${collection})`,
        );
        await this.nftRarityService.updateRarities(collection);
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
  }

  async addCollectionsToRarityQueue(
    collectionTickers: string[],
  ): Promise<void> {
    if (collectionTickers?.length > 0) {
      await this.redisClient.rpush(
        this.getRarityQueueCacheKey(),
        collectionTickers,
      );
    }
  }

  private async popAllCollectionsFromRarityQueue(): Promise<string[]> {
    const cacheKey = this.getRarityQueueCacheKey();
    let collections: string[] = [];
    let c: string;
    while ((c = await this.redisClient.lpop(cacheKey))) {
      collections.push(c);
    }
    return [...new Set(collections)];
  }

  private getRarityQueueCacheKey() {
    return generateCacheKeyFromParams(cacheConfig.rarityQueueClientName);
  }
}
