import { Constants } from '@multiversx/sdk-nestjs-common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Injectable } from '@nestjs/common';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { DateUtils } from 'src/utils/date-utils';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';

@Injectable()
export class UsdPriceRedisHandler extends RedisKeyValueDataloaderHandler<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'priceUSD');
  }

  mapValues(returnValues: { key: number; value: any }[], assetsIdentifiers: { [key: number]: any[] }) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = assetsIdentifiers && assetsIdentifiers[item.key] ? assetsIdentifiers[item.key][0] : null;
        redisValues.push(item);
      }
    }

    return [new RedisValue({ values: redisValues, ttl: Constants.oneWeek() })];
  }

  getCacheKey(key: number) {
    return generateCacheKeyFromParams('priceUSD', DateUtils.getDateFromTimestampWithoutTime(key));
  }
}
