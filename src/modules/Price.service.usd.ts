import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { cacheConfig } from 'src/config';
import { ElrondDataService } from 'src/common/services/elrond-communication/elrond-data.service';

@Injectable()
export class PriceServiceUSD {
  private redisClient: Redis.Redis;
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
    private dataService: ElrondDataService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  getPriceAtTimestamp(timestamp: number): Promise<number> {
    try {
      const cacheKey = this.getPriceForTimestampCacheKey(timestamp);
      const price = () =>
        this.dataService.getQuotesHistoricalTimestamp(timestamp);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        price,
        cacheConfig.followersttl,
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting the price for timestamp.',
        {
          path: 'DataServiceUSD.getPriceForTimestamp',
          timestamp,
        },
      );
    }
  }

  getLatestPrice(): Promise<number> {
    try {
      return this.dataService.getQuotesHistoricalLatest();
    } catch (err) {
      this.logger.error('An error occurred while getting the latest price.', {
        path: 'DataServiceUSD.getLatestPrice',
      });
    }
  }

  private getPriceForTimestampCacheKey(filters) {
    return generateCacheKeyFromParams('priceUSD', filters);
  }
}
