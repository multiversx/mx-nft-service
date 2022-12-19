import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@elrondnetwork/erdnest';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { Marketplace } from 'src/modules/marketplaces/models/Marketplace.dto';
import { TimeConstants } from 'src/utils/time-utils';
import { LocalRedisCacheService } from 'src/common';

@Injectable()
export class InternalMarketplaceRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(
    redisCacheService: RedisCacheService,
    localRedisCacheService: LocalRedisCacheService,
  ) {
    super(redisCacheService, 'internal_marketplace', localRedisCacheService);
  }

  mapValues(
    returnValues: { key: string; value: any }[],
    collectionIdentifiers: { [key: string]: Marketplace[] },
  ) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = collectionIdentifiers[item.key]
          ? collectionIdentifiers[item.key][0]
          : {};
        redisValues.push(item);
      }
    }

    return [
      new RedisValue({
        values: redisValues,
        ttl: 30 * TimeConstants.oneMinute,
      }),
    ];
  }
}
