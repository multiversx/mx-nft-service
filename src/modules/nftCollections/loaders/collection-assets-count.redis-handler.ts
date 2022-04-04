import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class CollectionAssetsCountRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(
      redisCacheService,
      'collectionAssetsCount',
      cacheConfig.collectionsRedisClientName,
    );
  }

  mapValues(
    returnValues: { key: string; value: any }[],
    assetsIdentifiers: { [key: string]: any[] },
  ): RedisValue[] {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = assetsIdentifiers[item.key]
          ? assetsIdentifiers[item.key][0]?.value
          : 0;
        redisValues.push(item);
      }
    }

    return [new RedisValue({ values: redisValues, ttl: TimeConstants.oneDay })];
  }
}
