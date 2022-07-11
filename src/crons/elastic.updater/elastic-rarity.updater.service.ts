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
import { RarityUpdaterService } from './rarity.updater.service';

@Injectable()
export class ElasticRarityUpdaterService {
  private readonly redisClient: Redis.Redis;

  constructor(
    private readonly elasticService: ElrondElasticService,
    private readonly nftRarityService: NftRarityService,
    private readonly rarityUpdaterService: RarityUpdaterService,
    private readonly logger: Logger,
    private readonly redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.rarityQueueClientName,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleValidateTokenRarity() {
    await this.rarityUpdaterService.handleUpdateToken();
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

    for (const collection of collectionsToUpdate) {
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
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleUpdateTokenRarityQueue() {
    await Locker.lock(
      'Elastic updater: Update rarities for all collections in the rarities queue',
      async () => {
        let notUpdatedCollections: string[] = [];
        const collectionsToUpdate: string[] =
          await this.redisCacheService.popAllItemsFromList(
            this.redisClient,
            this.getRarityQueueCacheKey(),
            true,
          );

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
