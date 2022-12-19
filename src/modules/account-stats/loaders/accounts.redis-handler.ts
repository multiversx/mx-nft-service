import { RedisCacheService } from '@elrondnetwork/erdnest';
import { Injectable } from '@nestjs/common';
import { LocalRedisCacheService } from 'src/common';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';

@Injectable()
export class AccountsRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(
    redisCacheService: RedisCacheService,
    localRedisCacheService: LocalRedisCacheService,
  ) {
    super(redisCacheService, CacheInfo.Account.key, localRedisCacheService);
  }

  mapValues(
    returnValues: { key: string; value: any }[],
    accountsAddreses: { [key: string]: any[] },
  ) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = accountsAddreses[item.key]
          ? accountsAddreses[item.key][0]
          : null;
        redisValues.push(item);
      }
    }

    return [
      new RedisValue({
        values: redisValues,
        ttl: CacheInfo.Account.ttl,
      }),
    ];
  }
}
