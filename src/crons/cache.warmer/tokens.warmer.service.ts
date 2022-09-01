import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Redis from 'ioredis';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Locker } from 'src/utils/locker';
import { ClientProxy } from '@nestjs/microservices';
import { cacheConfig } from 'src/config';
import { CachingService } from 'src/common/services/caching/caching.service';
import { TimeConstants } from 'src/utils/time-utils';
import { ElrondApiService } from 'src/common';

@Injectable()
export class TokensWarmerService {
  private redisClient: Redis.Redis;
  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private cacheService: CachingService,
    private elrondApiService: ElrondApiService,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updateTokens() {
    await Locker.lock(
      'MEX Tokens invalidations',
      async () => {
        const tokens =
          await this.elrondApiService.getAllMexTokensWithDecimals();
        await this.invalidateKey(
          CacheInfo.AllTokens.key,
          tokens,
          CacheInfo.AllTokens.ttl,
        );
      },
      true,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updateEgldTokens() {
    await Locker.lock(
      'Egld Token invalidation',
      async () => {
        const tokens = await this.elrondApiService.getEgldPriceFromEconomics();
        await this.invalidateKey(
          CacheInfo.EgldToken.key,
          tokens,
          CacheInfo.EgldToken.ttl,
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
      redisClientName: cacheConfig.persistentRedisClientName,
      key,
      ttl,
    });
  }
}
