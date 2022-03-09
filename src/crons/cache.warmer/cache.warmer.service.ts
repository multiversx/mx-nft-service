import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as Redis from 'ioredis';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { CollectionsService } from 'src/modules/nftCollections/collection.service';
import { Locker } from 'src/utils/locker';
import { Logger } from 'winston';
import { cacheConfig } from 'src/config';
import { CacheService } from 'src/common/services/caching/cache.service';

@Injectable()
export class CacheWarmerService {
  private redisClient: Redis.Redis;
  constructor(
    private collectionsService: CollectionsService,
    private cacheService: CacheService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.collectionsRedisClientName,
    );
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleEsdtTokenInvalidations() {
    await Locker.lock(
      'Collections tokens invalidations',
      async () => {
        const tokens = await this.collectionsService.getFullCollectionsRaw();
        await this.invalidateKey(
          CacheInfo.AllCollections.key,
          tokens,
          CacheInfo.AllCollections.ttl,
        );
      },
      true,
    );
  }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await this.cacheService.setCache(this.redisClient, key, data, ttl);
  }
}
