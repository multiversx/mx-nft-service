import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Redis from 'ioredis';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Locker } from 'src/utils/locker';
import { ClientProxy } from '@nestjs/microservices';
import { cacheConfig } from 'src/config';
import { CachingService } from 'src/common/services/caching/caching.service';
import { TimeConstants } from 'src/utils/time-utils';
import { TagsService } from 'src/modules/tags/tags.service';

@Injectable()
export class TagsWarmerService {
  private redisClient: Redis.Redis;
  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private tagsService: TagsService,
    private cacheService: CachingService,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.collectionsRedisClientName,
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleTagsInvalidations() {
    await Locker.lock(
      'Tags invalidations',
      async () => {
        const tokens = await this.tagsService.getAuctionTagsFromDb();
        await this.invalidateKey(
          CacheInfo.AuctionTags.key,
          tokens,
          5 * TimeConstants.oneMinute,
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
    await this.clientProxy.emit<{
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
