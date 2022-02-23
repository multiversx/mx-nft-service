import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { RedisDataloaderHandler } from 'src/modules/assets/redis-dataloader.handler';
import { DateUtils } from 'src/utils/date-utils';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';

@Injectable()
export class UsdPriceRedisHandler extends RedisDataloaderHandler<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'priceUSD', cacheConfig.followersttl);
  }

  mapValues(
    identifiers: number[],
    assetsIdentifiers: { [key: number]: any[] },
  ) {
    return identifiers.map((identifier) =>
      assetsIdentifiers && assetsIdentifiers[identifier]
        ? assetsIdentifiers[identifier][0]
        : null,
    );
  }

  getCacheKey(key: number) {
    return generateCacheKeyFromParams(
      'priceUSD',
      DateUtils.getDateFromTimestampWithoutTime(key),
    );
  }
}
