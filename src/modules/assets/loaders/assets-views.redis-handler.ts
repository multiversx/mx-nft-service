import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@elrondnetwork/erdnest';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { TimeConstants } from 'src/utils/time-utils';
import { LocalRedisCacheService } from 'src/common';

@Injectable()
export class AssetsViewsRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(
    redisCacheService: RedisCacheService,
    localRedisCacheService: LocalRedisCacheService,
  ) {
    super(redisCacheService, 'asset_views', localRedisCacheService);
  }

  mapValues(
    returnValues: { key: string; value: any }[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value =
          assetsIdentifiers && assetsIdentifiers[item.key]
            ? assetsIdentifiers[item.key][0].viewsCount
            : null;
        redisValues.push(item);
      }
    }

    return [
      new RedisValue({
        values: redisValues,
        ttl: 3 * TimeConstants.oneMinute,
      }),
    ];
  }
}
