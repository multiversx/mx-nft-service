import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Redis from 'ioredis';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { CollectionsService } from 'src/modules/nftCollections/collection.service';
import { Locker } from 'src/utils/locker';
import { ClientProxy } from '@nestjs/microservices';
import { cacheConfig } from 'src/config';
import { CachingService } from 'src/common/services/caching/caching.service';
import { TimeConstants } from 'src/utils/time-utils';

const EVERY_15_MINUTES = '0 */15 * * * *';

@Injectable()
export class CollectionsWarmerService {
  private redisClient: Redis.Redis;

  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private collectionsService: CollectionsService,
    private cacheService: CachingService,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.collectionsRedisClientName,
    );
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCollectionsInvalidations() {
    await Locker.lock(
      'Collections tokens invalidations',
      async () => {
        const tokens = await this.collectionsService.getFullCollectionsRaw();
        await this.invalidateKey(
          CacheInfo.AllCollections.key,
          tokens,
          TimeConstants.oneHour,
        );
      },
      true,
    );
  }

  @Cron(EVERY_15_MINUTES)
  async handleCollectionsMostActive() {
    await Locker.lock(
      'Collections Most Active tokens invalidations',
      async () => {
        const tokens = await this.collectionsService.getMostActiveCollections();
        await this.invalidateKey(
          CacheInfo.CollectionsMostActive.key,
          tokens,
          CacheInfo.CollectionsMostActive.ttl,
        );
      },
      true,
    );
  }

  @Cron(EVERY_15_MINUTES)
  async handleCollectionsMostFollowed() {
    await Locker.lock(
      'Collections Most Followed tokens invalidations',
      async () => {
        const tokens =
          await this.collectionsService.getMostFollowedCollections();
        await this.invalidateKey(
          CacheInfo.CollectionsMostFollowed.key,
          tokens,
          CacheInfo.CollectionsMostFollowed.ttl,
        );
      },
      true,
    );
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleTrendingCollection() {
    await Locker.lock(
      'Trending collections order by number of running auctions',
      async () => {
        const result =
          await this.collectionsService.getAllTrendingCollections();
        await this.invalidateKey(
          CacheInfo.trendingCollections.key,
          result,
          CacheInfo.trendingCollections.ttl,
        );
      },
      true,
    );
  }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await this.cacheService.setCache(this.redisClient, key, data, ttl);
    await this.refreshCacheKey(key, ttl);
  }

  private async refreshCacheKey(key: string, ttl: number) {
    this.clientProxy.emit<{
      redisClient: Redis.Redis;
      key: string;
      ttl: number;
    }>('refreshCacheKey', {
      redisClientName: cacheConfig.collectionsRedisClientName,
      key,
      ttl,
    });
  }
}
