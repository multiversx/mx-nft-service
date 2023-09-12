import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';

@Injectable()
export class AssetsViewsRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'asset_views');
  }

  mapValues(returnValues: { key: string; value: any }[], assetsIdentifiers: { [key: string]: any[] }) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = assetsIdentifiers && assetsIdentifiers[item.key] ? assetsIdentifiers[item.key][0].viewsCount : null;
        redisValues.push(item);
      }
    }

    return [
      new RedisValue({
        values: redisValues,
        ttl: 3 * Constants.oneMinute(),
      }),
    ];
  }
}
