import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { ClientProxy } from '@nestjs/microservices';
import { Locker } from '@multiversx/sdk-nestjs-common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';

import { CollectionsGetterService } from 'src/modules/nftCollections/collections-getter.service';

const EVERY_15_MINUTES = '0 */15 * * * *';

@Injectable()
export class CollectionsWarmerService {
  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private collectionsGetterService: CollectionsGetterService,
    private cacheService: CacheService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCollectionsInvalidations() {
    await Locker.lock(
      'Collections tokens invalidations',
      async () => {
        const tokens = await this.collectionsGetterService.getFullCollectionsRaw();
        await this.invalidateKey(CacheInfo.AllCollections.key, tokens, CacheInfo.AllCollections.ttl);
      },
      true,
    );
  }

  @Cron(EVERY_15_MINUTES)
  async handleCollectionsMostActive() {
    await Locker.lock(
      'Collections Most Active tokens invalidations',
      async () => {
        const tokens = await this.collectionsGetterService.getMostActiveCollections();
        await this.invalidateKey(CacheInfo.CollectionsMostActive.key, tokens, CacheInfo.CollectionsMostActive.ttl);
      },
      true,
    );
  }

  @Cron(EVERY_15_MINUTES)
  async handleCollectionsMostFollowed() {
    await Locker.lock(
      'Collections Most Followed tokens invalidations',
      async () => {
        const tokens = await this.collectionsGetterService.getMostFollowedCollections();
        await this.invalidateKey(CacheInfo.CollectionsMostFollowed.key, tokens, CacheInfo.CollectionsMostFollowed.ttl);
      },
      true,
    );
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleTrendingCollection() {
    await Locker.lock(
      'Trending collections order by number of running auctions',
      async () => {
        const result = await this.collectionsGetterService.getAllTrendingCollections();
        await this.invalidateKey(CacheInfo.TrendingCollections.key, result, CacheInfo.TrendingCollections.ttl);
      },
      true,
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleActiveCollectionsFromLast30Days() {
    await Locker.lock(
      'Active collections from last 30 days order by number auctions',
      async () => {
        const result = await this.collectionsGetterService.getActiveCollectionsFromLast30Days();
        await this.invalidateKey(CacheInfo.ActiveCollectionLast30Days.key, result, CacheInfo.ActiveCollectionLast30Days.ttl);
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
