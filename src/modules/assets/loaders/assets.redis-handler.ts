import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { TimeConstants } from 'src/utils/time-utils';
import { Asset } from '../models';

@Injectable()
export class AssetsRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'asset');
  }

  mapValues(
    returnValues: { key: string; value: any }[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = Asset.fromNft(assetsIdentifiers[item.key][0]);
        redisValues.push(item);
      }
    }
    return [
      new RedisValue({
        values: redisValues,
        ttl: TimeConstants.oneDay,
      }),
    ];
  }
}
