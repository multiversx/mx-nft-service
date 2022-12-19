import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@elrondnetwork/erdnest';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { TimeConstants } from 'src/utils/time-utils';
import { LocalRedisCacheService } from 'src/common';

@Injectable()
export class MarketplaceRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(
    redisCacheService: RedisCacheService,
    localRedisCacheService: LocalRedisCacheService,
  ) {
    super(redisCacheService, 'marketplace', localRedisCacheService);
  }

  mapValues(
    returnValues: { key: string; value: any }[],
    marketplaceKeys: { [key: string]: any[] },
  ): RedisValue[] {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = marketplaceKeys[item.key];
        redisValues.push(item);
      }
    }
    return [
      new RedisValue({ values: redisValues, ttl: TimeConstants.oneWeek }),
    ];
  }
}
