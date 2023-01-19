import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Redis from 'ioredis';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Locker } from 'src/utils/locker';
import { ClientProxy } from '@nestjs/microservices';
import { cacheConfig } from 'src/config';
import { CachingService } from 'src/common/services/caching/caching.service';
import { TimeConstants } from 'src/utils/time-utils';
import { AnalyticsService } from 'src/modules/analytics/analytics.service';

@Injectable()
export class TrendingCollectionsWarmerService {
  private redisClient: Redis.Redis;

  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private analytics: AnalyticsService,
    private cacheService: CachingService,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.collectionsRedisClientName,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async handleTrendingCollections(forTheLastHours: number = 24) {
    await Locker.lock(
      'Trending Collections invalidations',
      async () => {
        const tokens = await this.analytics.reindexTrendingCollections(
          forTheLastHours,
        );

        await this.invalidateKey(
          CacheInfo.TrendingByVolume.key,
          tokens,
          CacheInfo.TrendingByVolume.ttl,
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
