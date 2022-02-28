import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisDataloaderHandler } from 'src/modules/common/redis-dataloader.handler';
import { DateUtils } from 'src/utils/date-utils';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class UsdPriceRedisHandler extends RedisDataloaderHandler<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'priceUSD', TimeConstants.oneWeek);
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
