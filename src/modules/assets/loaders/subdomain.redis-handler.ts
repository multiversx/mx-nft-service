import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { SubdomainEntity } from 'src/db/subdomains';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class SubdomainsRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'subdomain');
  }

  mapValues(
    returnValues: { key: string; value: any }[],
    collectionIdentifiers: { [key: string]: SubdomainEntity[] },
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
        ttl: 30 * TimeConstants.oneSecond,
      }),
    ];
  }
}
