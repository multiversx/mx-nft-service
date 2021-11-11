import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ElrondDataService, RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { cacheConfig } from 'src/config';
import { DateUtils } from 'src/utils/date-utils';

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
          path: 'PriceServiceUSD.getPriceForTimestamp',
          timestamp,
          exception: err,
        },
      );
    }
  }

  getLatestPrice(): Promise<number> {
    try {
      return this.dataService.getQuotesHistoricalLatest();
    } catch (err) {
      this.logger.error('An error occurred while getting the latest price.', {
        path: 'PriceServiceUSD.getLatestPrice',
        exception: err,
      });
    }
  }

  private getPriceForTimestampCacheKey(timestamp) {
    return generateCacheKeyFromParams(
      'priceUSD',
      DateUtils.getDateFromTimestampWithoutTime(timestamp),
    );
  }
}
