import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Redis from 'ioredis';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Locker } from 'src/utils/locker';
import { cacheConfig } from 'src/config';
import { CacheService } from 'src/common/services/caching/cache.service';
import { TimeConstants } from 'src/utils/time-utils';
import { AuctionsGetterService } from 'src/modules/auctions';
import { DateUtils } from 'src/utils/date-utils';

@Injectable()
export class AuctionsWarmerService {
  private redisClient: Redis.Redis;
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private cacheService: CacheService,
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
          TimeConstants.oneHour,
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
          TimeConstants.oneHour,
        );
      },
      true,
    );
  }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await this.cacheService.setCache(this.redisClient, key, data, ttl);
  }
}
