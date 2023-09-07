import { Injectable } from '@nestjs/common';
import { Constants, RedisCacheService } from '@multiversx/sdk-nestjs';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';

@Injectable()
export class CollectionAssetsCountRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, CacheInfo.CollectionAssetsCount.key);
  }

  mapValues(returnValues: { key: string; value: any }[], assetsIdentifiers: { [key: string]: any[] }): RedisValue[] {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = assetsIdentifiers[item.key] ? assetsIdentifiers[item.key][0]?.value : 0;
        redisValues.push(item);
      }
    }

    return [new RedisValue({ values: redisValues, ttl: Constants.oneDay() })];
  }
}
