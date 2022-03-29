import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Redis from 'ioredis';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Locker } from 'src/utils/locker';
import { cacheConfig } from 'src/config';
import { ClientProxy } from '@nestjs/microservices';
import { CachingService } from 'src/common/services/caching/caching.service';
import { TimeConstants } from 'src/utils/time-utils';
import { AuctionsGetterService } from 'src/modules/auctions';
import { DateUtils } from 'src/utils/date-utils';

@Injectable()
export class AuctionsWarmerService {
  private redisClient: Redis.Redis;
  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private auctionsGetterService: AuctionsGetterService,
    private cacheService: CachingService,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.auctionsRedisClientName,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAuctionsEndingToday() {
    await Locker.lock(
      'Auctions ending today tokens invalidations',
      async () => {
        const tokens =
          await this.auctionsGetterService.getRunningAuctionsEndingBefore(
            DateUtils.getCurrentTimestampPlus(24),
          );
        await this.invalidateKey(
          CacheInfo.AuctionsEndingToday.key,
          tokens,
          5 * TimeConstants.oneMinute,
        );
      },
      true,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAuctionsEndingInAMonth() {
    await Locker.lock(
      'Auctions tokens ending in a month invalidations',
      async () => {
        const tokens =
          await this.auctionsGetterService.getRunningAuctionsEndingBefore(
            DateUtils.getCurrentTimestampPlusDays(30),
          );
        await this.invalidateKey(
          CacheInfo.AuctionsEndingInAMonth.key,
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
    await this.clientProxy.emit('refreshCacheKey', {
      key,
      ttl,
      redisClientName: cacheConfig.auctionsRedisClientName,
    });
  }
}
