import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class IsAssetLikedRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'isAssetLiked');
  }

  mapValues(
    returnValues: { key: string; value: any }[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = assetsIdentifiers[item.key]
          ? assetsIdentifiers[item.key][0].liked
          : 0;
        redisValues.push(item);
      }
    }

    return [
      new RedisValue({
        values: redisValues,
        ttl: TimeConstants.oneWeek,
      }),
    ];
  }
}
