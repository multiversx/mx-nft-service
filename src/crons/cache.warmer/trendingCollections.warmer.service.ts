import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { ClientProxy } from '@nestjs/microservices';
import { Locker } from '@multiversx/sdk-nestjs-common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { TrendingCollectionsService } from 'src/modules/analytics/trending/trending-collections.service';

@Injectable()
export class TrendingCollectionsWarmerService {
  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private trendingCollectionsService: TrendingCollectionsService,
    private cacheService: CacheService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleTrendingCollections(forTheLastHours: number = 24) {
    await Locker.lock(
      'Trending Collections invalidations',
      async () => {
        const tokens = await this.trendingCollectionsService.reindexTrendingCollections(forTheLastHours);

        await this.invalidateKey(CacheInfo.TrendingByVolume.key, tokens, CacheInfo.TrendingByVolume.ttl);
      },
      true,
    );
  }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await this.cacheService.set(key, data, ttl);
    await this.refreshCacheKey(key, ttl);
  }

  private async refreshCacheKey(key: string, ttl: number) {
    this.clientProxy.emit<{
      key: string;
      ttl: number;
    }>('refreshCacheKey', {
      key,
      ttl,
    });
  }
}
