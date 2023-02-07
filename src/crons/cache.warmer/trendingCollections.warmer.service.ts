import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { ClientProxy } from '@nestjs/microservices';
import { cacheConfig } from 'src/config';
import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { CachingService, Locker } from '@multiversx/sdk-nestjs';

@Injectable()
export class TrendingCollectionsWarmerService {
  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private analytics: AnalyticsService,
    private cacheService: CachingService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
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
    await this.cacheService.setCache(key, data, ttl);
    await this.refreshCacheKey(key, ttl);
  }

  private async refreshCacheKey(key: string, ttl: number) {
    this.clientProxy.emit<{
      key: string;
      ttl: number;
    }>('refreshCacheKey', {
      redisClientName: cacheConfig.collectionsRedisClientName,
      key,
      ttl,
    });
  }
}
