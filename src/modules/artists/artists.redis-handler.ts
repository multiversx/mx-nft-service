import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@elrondnetwork/erdnest';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { LocalRedisCacheService } from 'src/common';

@Injectable()
export class ArtistAddressRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(
    redisCacheService: RedisCacheService,
    localRedisCacheService: LocalRedisCacheService,
  ) {
    super(redisCacheService, CacheInfo.Artist.key, localRedisCacheService);
  }

  mapValues(
    returnValues: { key: string; value: any }[],
    accountsAddresses: { [key: string]: any[] },
  ) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = accountsAddresses[item.key]
          ? accountsAddresses[item.key][0]
          : null;
        redisValues.push(item);
      }
    }

    return [
      new RedisValue({
        values: redisValues,
        ttl: CacheInfo.Artist.ttl,
      }),
    ];
  }
}
